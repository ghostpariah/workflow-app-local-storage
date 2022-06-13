
const electron = require('electron')
const {app, BrowserWindow, ipcMain, Menu, MenuItem, globalShortcut} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const fsc = require('fs')
const fsp = require('fs/promises')
const {autoUpdater} = require('electron-updater')
const log = require('electron-log');
const errLog = log.create('anotherInstance')

const process = require('process')



const { serialize } = require('v8')
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require('constants')
const { get } = require('https')
const { resolve } = require('path')
const { webContents } = require('electron/main')
const sqlite3 = require('sqlite3').verbose()

const date = new Date()
const m= date.getMonth()+1
const d = date.getDate()
const y = date.getFullYear()
const strToday = `${m}/${d}/${y}`
const dayOfYear = date =>
    Math.floor((date - new Date(date.getFullYear(),0 ,0)) / (1000 * 60 * 60 * 24));
let today = dayOfYear(new Date()); 
const appStartDay = today
/**
 * rootStorage is set to a mapped network drive of v:/ in order for many instances to share
 * the same data
 * If going to use as a single instance on a computer without mapping to a drive on the server,
 * set rootStorage to the local storage using electron's app.getPath('userData')
 */
const rootStorage = app.getPath('userData')
//const rootStorage = 'v:/'

const backupFolder = path.join(rootStorage,'/backup/')
const dataFolder = path.join(rootStorage, `/data/`)
const workflowDB = path.join(rootStorage, '/data', 'workflow_app.db')

const white_board = path.join(rootStorage, '/data', 'whiteBoardContent.txt')
const logArchive = path.join(rootStorage, `/data/logs/${y}/${today}/`)
const logLocation = path.join(rootStorage, `/data/logs/`)
const activityLog = path.join(rootStorage, '/data/logs', `activityLog${today}.txt`)
const errorLog = path.join(rootStorage, '/data/logs', `errorLog${today}.txt`)




let objList
let win 

let fsWait = false;
let loginWin
let contactWin
let reportWin
let restoreWin
let addJobWin
let calendarWin
let cuWin
var checkDate
let updateWin
let uncaughtCount = 0

/***********************
********
onload operations
**********
*************************/
//set path to errorLog files
errLog.transports.file.resolvePath = () => errorLog;
async function readyUpdates(){
   
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    log.info('App starting...');

    autoUpdater.on('checking-for-update', () => {
        sendStatusToWindow('Checking for update...');
    })
    autoUpdater.on('update-available', (info) => {
        sendStatusToWindow('Update available.');
    })
    autoUpdater.on('update-not-available', (info) => {
        sendStatusToWindow('Update not available.');
       
    })
    autoUpdater.on('error', (err) => {
        sendStatusToWindow('Error in auto-updater. ' + err);
        
    })
    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent.toFixed() + '%';
        log_message = log_message + ' (' + progressObj.transferred.toFixed() + "/" + progressObj.total.toFixed() + ')';
        sendStatusToWindow(log_message);
    })
    autoUpdater.on('update-downloaded', (info) => {
        sendStatusToWindow('Update downloaded');
        autoUpdater.quitAndInstall();
    });
}
process.on('uncaughtException', (err, origin) => {
    uncaughtCount++
    console.log(err)
    logErr(err)
    logErr(origin)
    if(uncaughtCount<2){
        restartApp()
    }
  });


/**
 * creates directory and any parent directories if isRecursive = true
 * used for setting up folders on the v:drive to store database, text files and logs
 * @param {string} dir //path of directory to create
 * @param {boolean} isRecursive //boolean for recursive key in fsp.mkdir
 * 
 */
function createFolder(dir, isRecursive){
    fsp.mkdir(dir, {recursive:isRecursive})
    .then(()=>{
        console.log(`${dir} created succesfully`)
    }).catch(()=>{
        errLog.info('failed to create directory')
    });
}


/**
 * Uses fsp.readdir to check for the existence of directory
 * and if directory doesnt exist calls the createFolder passing the path 
 * and the recursive key value
 * @param {string} dir //path to directory
 * @param {boolean} isRecursive //recursive key
 * @returns 
 */
async function checkForFolder(dir, isRecursive){
    try {
        const files = await fsp.readdir(dir);
        for (const file of files)
          console.log(`${dir} ${file}`);
    } catch (err) {        
        return createFolder(dir,isRecursive)
    }
}

/**
 * 
 * @param {string} db -path to database
 * @returns 
 */
async function checkForDB(db){    
    try{
    const info = await fsp.stat(db)
    }catch(e){
        //updateWin.webContents.send('new-database')
        return createDatabase(db)
    }
}


async function checkForWhiteboard(){
    const wb = await fsp.stat(white_board).catch(e =>{fs.closeSync(fs.openSync(white_board,'w'))})
    console.log(wb)    
}
async function checkForPathToRootStorage(path){
    try {
        const files = await fsp.readdir(rootStorage);
        return true
        
    } catch (err) {
        log.info(err)
        console.error(err);
        app.quit()
        return 
    }
}
async function readyApp(){
    
    try{
    await readyUpdates().catch(e =>{errLog.info(e)})
    
    if(await checkForPathToRootStorage(rootStorage)){
    
        await checkForFolder(backupFolder, false)
        await checkForFolder(logLocation, true)        
        await checkForDB(workflowDB)
        readyFolders()
        
        setTimeout(() => {
            checkForWhiteboard()
            backupDB()
            fs.watch(white_board, (event, filename) => {
                        if (filename) {        
                          if (fsWait) return;    
                          fsWait = setTimeout(() => {
                            fsWait = false;      
                          }, 200);      
                          
                          setTimeout(function() {
                              win.webContents.send('whiteboard-updated')
                          }, 50);      
                        }else{
                            errLog.error(`whiteboard file doesn't exist or connection to v: lost`)
                        }
                        
                    });
        }, 100);
    }else{
        errLog.error('rootStorage (v:) not mapped')
        app.quit()
    }    
        
    }catch(e){
        log.info(e)
    }

    
}


//function to create database if it doesn't exist
function createDatabase(file){
    console.log('createDatabase triggered')
    //build sql statements
    let customersSQL = `CREATE TABLE "customers" (
        "customer_ID"	INTEGER NOT NULL UNIQUE,
        "customer_name"	TEXT NOT NULL,
        PRIMARY KEY("customer_ID" AUTOINCREMENT)
    )`
    let contactsSQL = `CREATE TABLE "contacts" (
        "contact_ID"	INTEGER NOT NULL UNIQUE,
        "first_name"	TEXT NOT NULL,
        "last_name"	TEXT,
        "customer_ID"	INTEGER,
        "active"	INTEGER NOT NULL DEFAULT 0,
        "primary_contact"	INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY("contact_ID" AUTOINCREMENT),
        FOREIGN KEY("customer_ID") REFERENCES "customers"("customer_ID") ON DELETE CASCADE ON UPDATE CASCADE
    )`
    let emailsSQL = `CREATE TABLE "emails" (
        "email_ID"	INTEGER NOT NULL UNIQUE,
        "email"	TEXT,
        "e_contact_ID"	INTEGER,
        "active"	INTEGER,
        FOREIGN KEY("e_contact_ID") REFERENCES "contacts"("contact_ID") ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY("email_ID" AUTOINCREMENT)
    )`
    let phoneNumbersSQL = `CREATE TABLE "phone_numbers" (
        "phone_ID"	INTEGER NOT NULL UNIQUE,
        "number"	TEXT,
        "p_contact_ID"	INTEGER,
        "active"	INTEGER,
        FOREIGN KEY("p_contact_ID") REFERENCES "contacts"("contact_ID") ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY("phone_ID" AUTOINCREMENT)
    )`
    let jobsSQL =`CREATE TABLE "jobs" (
        "job_ID"	INTEGER NOT NULL UNIQUE,
        "user_ID"	INTEGER,
        "customer_ID"	INTEGER NOT NULL,
        "contact_ID"	INTEGER,
        "number_ID"	INTEGER,
        "email_ID"	INTEGER,
        "notes"	TEXT,
        "estimated_cost"	NUMERIC,
        "date_in"	TEXT,
        "date_called"	TEXT,
        "date_scheduled"	TEXT,
        "time_of_day"	TEXT,
        "julian_date"	INTEGER,
        "designation"	TEXT,
        "status"	TEXT,
        "shop_location"	TEXT,
        "unit"	TEXT,
        "job_type"	TEXT,
        "cash_customer"	INTEGER,
        "approval_needed"	INTEGER,
        "checked"	INTEGER,
        "waiting_customer"	INTEGER,
        "comeback_customer"	INTEGER,
        "parts_needed"	INTEGER,
        "active"	INTEGER,
        "no_show"	INTEGER,
        "cancelled"	INTEGER,
        FOREIGN KEY("number_ID") REFERENCES "phone_numbers"("phone_ID") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY("email_ID") REFERENCES "emails"("email_ID") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY("contact_ID") REFERENCES "contacts"("contact_ID"),
        FOREIGN KEY("customer_ID") REFERENCES "customers"("customer_ID"),
        PRIMARY KEY("job_ID" AUTOINCREMENT)
    )`
    let usersSQL =`CREATE TABLE "users" (
        "user_ID"	INTEGER NOT NULL UNIQUE,
        "user_name"	TEXT NOT NULL,
        "role"	TEXT NOT NULL,
        "active"	INTEGER NOT NULL,
        "password"	TEXT NOT NULL,
        PRIMARY KEY("user_ID" AUTOINCREMENT)
    )`
    let createAdminSQL = `INSERT INTO users (user_name,role,active,password)
    VALUES ('admin','admin',1,'password');`

    var db = new sqlite3.Database(file, (err)=>{
        if(err){
            console.error(err.message)
        }
        console.log(err)
    });
    
        console.log("creating database file");     
    
        db.serialize(function() {
            db.run(customersSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
            db.run(contactsSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
            db.run(emailsSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
            db.run(phoneNumbersSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
            db.run(jobsSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
            db.run(usersSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
            db.run(createAdminSQL, function(createResult){
                if(createResult) console.log(createResult);
            });
        })
       
    return db;
}
app.on('ready', ()=>{
    createUpdateWindow()
    // prompt restart if app was left open on previous day
    
    
    checkDate = setInterval(function (){
        let currentDay = dayOfYear(new Date());
        (appStartDay == currentDay) ? console.log(`app opened today ${currentDay}`) : restartApp();
    }, 3600000)
    readyApp()
    //check for updates
    
    //autoUpdater.checkForUpdates()
    
    
    // ready the files. create folder for year and day if it doesn't exist and then
    // copy log files to the directory and empty the daily logs

    //check if logs/ directory is empty

    // create activityLog and archive folders if activityLog doesn't exist (this
    // means the app is opened for the first time)


    

    

    
    
   
    
    
       
})
function readyFolders(){
    try{
        fs.readdir(logLocation, function(err, data) {
            if(err){
                console.log(err)
            }
            if (data.length == 0) {
                
                // create activity log
                fs.closeSync(fs.openSync(activityLog,'w'))
                // create error log
                fs.closeSync(fs.openSync(errorLog,'w'))
                //create archive folder for today
                fs.mkdirSync(logArchive, {
                    recursive: true
                });  
    
            } else {
                
                let needsActivityLog = true
                let needsErrorLog = true
                let doy
                let oldPath
                let newPath
                // iterate through items in logs folder
                data.forEach(file => {
                    // if item is a file and not year directory i.e. 2021
                    if(file.length>4){
                        doy = file.slice(file.indexOf('g')+1,file.indexOf('g')+4)
                        console.log(doy)
                        
                        
                        if(file.includes(`activityLog${today}`)){
                            
                            needsActivityLog = false
                        }
                        if(file.includes(`errorLog${today}`)){
                            needsErrorLog = false
                        }
                        if(doy != today){
                         let lastDay = (isLeapYear(y)) ? 366 : 365   
                            switch(file.slice(0,1)){
                                case 'a':
                                    oldALogPath = path.join(logLocation, `activityLog${doy}.txt`)
                                    if(doy == "365" || doy =="366"){
                                        if (!fs.existsSync(`${logLocation}${y-1}/${doy}/`)){ 
                                            fs.mkdirSync(`${logLocation}${y-1}/${doy}/`, {
                                                recursive: true
                                            });  
                                        }
                                        newALogPath = path.join(logLocation, `${y-1}/${doy}/activityLog.txt`)                                                               
                                    }else{
                                        if (!fs.existsSync(`${logLocation}${y}/${doy}/`)){ 
                                            fs.mkdirSync(`${logLocation}${y}/${doy}/`, {
                                                recursive: true
                                            });  
                                        }
                                        newALogPath = path.join(logLocation, `${y}/${doy}/activityLog.txt`)                                    
                                    }
                                    fs.rename(oldALogPath, newALogPath, function (err) {
                                        if (err) throw err
                                        console.log('Successfully moved to '+newALogPath)
                                    })
                                    break;
                                case 'e':
                                    oldELogPath = path.join(logLocation, `errorLog${doy}.txt`)
                                    if(doy == lastDay){
                                        if (!fs.existsSync(`${logLocation}${y-1}/${doy}/`)){ 
                                            fs.mkdirSync(`${logLocation}${y-1}/${doy}/`, {
                                                recursive: true
                                            });  
                                        }                                   
                                        newELogPath = path.join(logLocation, `${y-1}/${doy}/errorLog.txt`)                           
                                    }else{
                                        if (!fs.existsSync(`${logLocation}${y}/${doy}/`)){ 
                                            fs.mkdirSync(`${logLocation}${y}/${doy}/`, {
                                                recursive: true
                                            });  
                                        }                                     
                                        newELogPath = path.join(logLocation, `${y}/${doy}/errorLog.txt`)
                                    }
                                    fs.rename(oldELogPath, newELogPath, function (err) {
                                        if (err){ 
                                            console.log(err)
                                        }else{
                                            console.log('Successfully moved to '+newELogPath)
                                        }
                                        
                                    })
                                    break;
                                default:
                                    break;
                            }
                            
                            
                            
                            
                            
                           
                        }
    
                    }
                    
                    
                });
    
                if(needsActivityLog){
                    fs.closeSync(fs.openSync(activityLog,'w'))
                }
                if(needsErrorLog){
                    fs.closeSync(fs.openSync(errorLog,'w'))
                }
            
                if (!fs.existsSync(logArchive)){ 
                    fs.mkdirSync(logArchive, {
                        recursive: true
                    });  
                }
            }
            //watch file for changes
            
                let actLogWatcher = fs.watch(activityLog, (eventType, filename) => {
                
                    if (filename) {        
                        if (fsWait) return;    
                        fsWait = setTimeout(() => {
                            fsWait = false;      
                        }, 5);      
                        
                        setTimeout(function() {
                            
                            win.webContents.send('update')
                        }, 5);      
                    }else{
                        errLog.error(`activityLog file doesn't exist or connection to v: lost`)
                    }
                    
                });
                console.log(actLogWatcher)
           
        })
    
    }catch(e){
        console.log(e)
    }
}
function initiateFSWatcher(){
    try{
        fs.watch(activityLog, (event, filename) => {
              
            if (filename) {        
                if (fsWait) return;    
                fsWait = setTimeout(() => {
                    fsWait = false;      
                }, 5);      
                console.log('log watch triggered')
                setTimeout(function() {
                
                win.webContents.send('update')
                }, 5);      
            }
            
        });
        fs.watch(white_board, (event, filename) => {
                
            if (filename) {        
                if (fsWait) return;    
                fsWait = setTimeout(() => {
                    fsWait = false;      
                }, 5);      
                console.log('whiteboard watch triggered')
                setTimeout(function() {
                
                win.webContents.send('update')
                }, 5);      
            }
            
        });
    }catch(e){
       
        console.log(e)
    }
}
app.on('window-all-closed', ()=>{
    if(process.platform !== 'darwin'){
        app.quit()
    }
})
app.on('activate', () => {
    checkForData()
    createMainWindow()
    
})



//watches for changes on whiteboard text file and reloads page with changed file
// try{

// fs.watch(white_board, (event, filename) => {
//     if (filename) {        
//       if (fsWait) return;    
//       fsWait = setTimeout(() => {
//         fsWait = false;      
//       }, 200);      
      
//       setTimeout(function() {
//           win.webContents.send('whiteboard-updated')
//       }, 50);      
//     }
    
// });
// }catch(e){
    
       
//         console.log(e)
    
// }

/***********************************************************************
 * 
 * All IPC module communication with other windows
 * 
 ***********************************************************************/



/************************************
 * communication with main workflow page js index.js
 * 
 ************************************/
ipcMain.on('create-new-database',(event)=>{
    createDatabase(workflowDB)
})
ipcMain.on('get-backups',(event)=>{
    let arrBackups = new Array()
    
    fs.readdir(backupFolder, function (err, files) {
        if (err) {
          console.error("Could not list the directory.", err);
          process.exit(1);
        }
        
        files.forEach(function (file, index){
            var fromPath = path.join(backupFolder, file);
            let objBackups = new Object()
            objBackups.stats = fs.statSync(fromPath)
            objBackups.fileName = file
            arrBackups.push(objBackups)

        })
        console.log(arrBackups)
        event.returnValue = arrBackups
    })
})
const renameDB = async (oldName,newName)=>{
    
    return await fsp.rename(oldName, newName)
}
ipcMain.on('restore-database',(event,restorePoint)=>{
    let arrBackups
    let newDB = path.join(backupFolder, restorePoint)
    let corruptedDB = path.join(dataFolder, 'curruptWorkflow.db')
    
    renameDB(workflowDB,corruptedDB).then((res) => {
        console.log(`${res} renamed`);
    }).catch(e =>{console.log(e)})
    
    try{
        
        let dboRestore = new sqlite3.Database(newDB, (err)=>{
            if(err){
                console.error('Cant create connection'+err.message)
            }
            
        })
       

        /**
         * setTimeout used to allow renameDB to complete before trying to make backup.
         * Without the delay a SQL_CANT_OPEN  error is thrown because the the workflow_app.db
         * still exists when the dboRestore.backup() is trying to create the new db from the 
         * backup file
         */

        setTimeout(() => {
            
        
            let restore=dboRestore.backup(path.join(dataFolder, 'workflow_app.db'), (err)=>{
            if(err){
                console.log('yo momma'+err)
            }else{
                let NPAGES = -1
                let h = setInterval(() => {
                    
                    
                    if(restore.idle){
                        NPAGES++
                        restore.step(restore.pageCount)
                        console.log('page count = '+restore.pageCount)
                        console.log('pages remaining = '+restore.remaining)
                        
                    }
                    if(restore.completed || restore.failed){
                        clearInterval(h)
                        console.log(restore.pageCount)
                        console.log('completed = ' +restore.completed)
                        console.log('failed = '+restore.failed)
                        console.log(restore.retryErrors)

                        dboRestore.close()
                        win.webContents.send('update')
                        logActivity('restored')
                    }
                
                }, 250);
                     }
                 })
        }, 200);
    }catch(e){
        errLog.info(e)
    }
    
})
ipcMain.on('log-error', (event,args)=>{
    
    errLog.info(args)
    
})
ipcMain.on('start-app',(event)=>{
    updateWin.close()
    createMainWindow()
    
})
ipcMain.on('no-updates', (event)=>{
    updateWin.close()
    createMainWindow()
})

 ipcMain.on('get-whiteboard', (event, args1, args2)=>{
    let d
    
    if(args1 == 'read'){
        d= fs.readFileSync(white_board, 'UTF-8',function (err, data) {
            if (err) console.log(err);
            return data
        });
        event.returnValue = d
        
    }
    if(args1 == 'write'){
        fs.writeFile(white_board, args2, function (err) { 
            if (err)
                console.log(err);
            else
                console.log('Write operation complete.');
                
                
        });
        if(win){
            win.webContents.send('whiteboard-updated')
        }
    }
      // fs.close()
  })

  /**************
   * communication involving job 
   *************/

  //pull information on a single job
  ipcMain.on('pull-job',(event,args)=>{
    let dboPullJob = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let sql = `SELECT * FROM jobs WHERE job_ID = ?`
    let id = args
    dboPullJob.all(sql,[id],function (err,row){
        if(err){
            return err
        }else{
            
            event.returnValue = row[0]
        }
        dboPullJob.close()
    })
    
    
})

//pull information on all active jobs
ipcMain.on('pull_jobs', (event,args)=>{
    let dboPullJobs = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let sql = `SELECT * FROM jobs WHERE active = 1 AND cancelled = 0`
    dboPullJobs.all(sql,function (err,row){
        if(err){
            return err
        }else{
            
            event.returnValue = row
        }
        dboPullJobs.close()
    })
    
    
})
ipcMain.on('update-main-page', (event)=>{
    win.webContents.send('update')
})
//update a single job
ipcMain.on('update-job',(event, args, args2, args3, args4)=>{
    console.log("args4 from update-job"+args4)
    let k = Object.keys(args)
    let v = Object.values(args)
    let arrC = new Array()
    let arrV = new Array()
    let strColumns 
    let strValues 
    for(i=1;i<k.length;i++){
            
            arrC.push(`${k[i]}='${v[i]}'`)
            arrV.push(v[i])
    }
    if(arrC.length > 1){
    strColumns = arrC.join(',')
    }else{
        strColumns = arrC[0]
    }
    if(arrV.length > 1){
    strValues = arrV.join(',')
    }else{
        strValues =arrV[0]
    }
   

    let dboUpdate = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let pull = `SELECT * FROM jobs WHERE active = 1 AND cancelled = 0`
    let sql = `UPDATE jobs SET ${strColumns} WHERE job_ID = ${args.job_ID}`
    
    dboUpdate.serialize(()=>{
        dboUpdate.run(sql, function(err,row) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`Row(s) updated: ${this.changes}${row}`);

            
        })
        .all(pull, [], (err,row)=>{
            if(err){
            return console.error(err.message);
            }else{
                args.user = args3
                switch(args2){
                    case 'context-menu' :
                        
                        
                        break;
                    case 'edit job':
                        winEdit.close()
                        break;
                    case 'calendar':                        
                        calendarWin.webContents.send('refresh')
                        break;
                    default:
                        
                        break;
                }
                args.customer_name = args4
               
               logActivity('edited',args, args3)
                win.webContents.send('update',row)
                
            }
        }) 

        dboUpdate.close()
    });
    
})

//change location of job when job is dropped in a different container
ipcMain.on('edit-location-drop',(event,args,args2,args3)=>{
    
    let dboLocation = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    dboLocation.serialize(()=>{
        
        let p = Object.keys(args)

        //assign an array of key/column values for sql statement from the javascript object
        let v = Object.values(args)
    
        
    
        //building placeholder for SQL based on amount of items in object
        let columnPlaceholders = p.join("=?, ")
        columnPlaceholders = columnPlaceholders+'=?'
        
        let sql = `UPDATE jobs SET status=?, shop_location=?, designation=?, date_in=? WHERE job_ID= ?`;
        
        let sql1 = `UPDATE jobs
                SET shop_location = ?,
                status = ?
                WHERE job_ID = ?`;
        let sql2 = `SELECT * FROM jobs WHERE job_ID = ${args.job_ID}`
        dboLocation.run(sql, v, function(err) {
            if (err) {
                return console.error(err.message);
            }
            args.user = args2
            args.customer_name = args3
            logActivity('moved',args)
        }) 
        
        
        .all(sql2,function (err,row){
            if(err){
                console.log('first select'+err.message)
                return err
            }else{                
                
                event.returnValue = row
            }
        })   
        
        dboLocation.close()
         
    })
    
})

//handler to edit job loaction when placing a newly created job
ipcMain.on('edit-location',(event,args)=>{
    console.log(args.shop_location)
    let dboLocation = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let data = [args.shop_location, args.job_ID]
    
    let sql = `UPDATE jobs
            SET shop_location = ?
            WHERE job_ID = ?`;
    dboLocation.run(sql, data, function(err) {
        if (err) {
            return console.error(err.message);
        }
        
        console.log(`Row(s) updated: ${this.changes}`);

        dboLocation.close()
        });  
        
        
})

ipcMain.on('get-job', (event,args)=>{
    let dboJob = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let sql = `SELECT * FROM jobs WHERE job_ID = ${args}`
    dboJob.all(sql,function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
            event.returnValue = row[0]
        }
        dboJob.close() 
    })
    
      
})

ipcMain.on('get-jobs', (event,args)=>{
    let dboJob = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let sql = `SELECT * FROM jobs WHERE customer_ID = ${args} AND (active ISNULL OR active=0) AND (no_show ISNULL OR no_show =0) AND (cancelled=0 OR cancelled ISNULL)`
    dboJob.all(sql,function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
            event.returnValue = row
        }
        dboJob.close() 
    })
    
      
})
ipcMain.on('db-get-customer-name',(event, args)=>{
    
    let dboCustomerName = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    
    let sql = `SELECT customer_name FROM customers WHERE customer_ID = ?`
    dboCustomerName.all(sql,[args],function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
            //console.log(args)
            //console.log(`from db-get-customer-name row= ${row[0].customer_name}`)
            event.returnValue = row[0]?.customer_name
        }
        dboCustomerName.close()
    })
    
    
})
function restartApp(){
    console.log('restarting app');
    clearInterval(checkDate);
    app.relaunch();
    app.quit();
}
function isLeapYear(year) {
    return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
}

async function getCustomerName(args){
    
    let dboCustomerName = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    
    let sql = `SELECT customer_name FROM customers WHERE customer_ID = ?`
    dboCustomerName.all(sql,[args],function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
            console.log('returned info from getCustomerName() '+row[0]+" "+row[0].customer_name)
            return row[0]?.customer_name
        }
        dboCustomerName.close()
    })
    
    
}
   function logErr(text){
        
        errLog.info(text)
   } 
    
    
    async function logActivity(args1, args2, args3){
        console.log(`args2 in logActivity = ${JSON.stringify(args3)}`)
        let jobCustomer
        const actLog = fs.createWriteStream(activityLog, { flags: 'a' });      
        let date = new Date()
        let action = args1
        let logEvent
        let k
        let v
        let place
        let change =""
        let timeStamp = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`

        if(args2){
            k = Object.keys(args2)
            v = Object.values(args2)
            let lt 
            if(args2.shop_location != undefined && args2.shop_location != ""){
                lt = args2.shop_location.substring(0,3)
            }else{
                if(args2.status == 'wfw') lt = 'wfw';
                if(args2.status == 'sch') lt = 'sch';
                if(args2.status == 'wpu') lt = 'wpu';
            }
            
            
            switch(lt){
                case 'wfw':
                    place = 'the lot'
                break;
                case 'wip':
                    place = 'the shop'
                break;
                case 'sch':
                    place = 'scheduled'
                break;
                case 'wpu':
                    place = 'completed'
                default:
                    
                break;
            }
       
        }
        
            
        
        
        switch(action){
            case 'moved':
                logEvent = `${args2.user.user_name} moved ${args2.customer_name} jobID-${args2.job_ID} to ${place} at ${timeStamp}\n`
                 break;
            case 'added':
                for(i=0;i<k.length;i++){
                    if(k[i] != 'job_ID' && k[i]!= 'user_ID' && k[i]!= 'user' && k[i]!= 'customer_ID' && k[i]!= 'customer_name'){
                        
                        change+= `${k[i]}:[${v[i]}], `
                    }
                }                
                              
                logEvent = `${args2.user.user_name} added ${args2.customer_name} job ID:${args2.job_ID} to ${place} at ${timeStamp}\n`
                break;
            case 'edited':
                if(place == 'completed'){
                        change = 'job status to COMPLETED'    
                }else{
                    for(i=0;i<k.length;i++){
                        if(k[i] != 'job_ID' && k[i]!= 'user_ID' && k[i]!= 'user' && k[i]!= 'customer_ID' && k[i]!= 'customer_name'){
                        
                            change+= `${k[i]} to ${v[i]}, `
                            
                        }
                    }                    
                }
                logEvent = `${args2.user.user_name} edited ${args2.customer_name} jobID-${args2.job_ID} and changed [${change}] at ${timeStamp}\n`
                break;
            case 'delete':
                logEvent = `${args2.user.user_name} Deactivated job-ID ${args2.job_ID} at ${timeStamp}\n`
                break;
            case 'restored':
                logEvent = 'restored database'
                break;
                default:
                    logEvent = "error"
                    break;
        }
       
        
       actLog.write(logEvent)
       actLog.close()
    
       
    }
    async function pullName(id){
        let result = await getCustomerName(id)
        return result
    }
    async function getUserName(args){
        
        let result = 'b'
        
        let dboUsers = new sqlite3.Database(workflowDB, (err)=>{
            if(err){
                console.error(err.message)
            }        
        })
        let sql = `SELECT user_name FROM users WHERE user_ID = ${args}`
            dboUsers.all(sql, [],function(err, row){
                if(err){
                    console.log(err.message)
                    return err
                }
                console.log(row)
                
               return row
                       
                           
            })
            dboUsers.close()
           // return result
    }
    async function pullUserName(args){
        let result = await getUserName(args)
        console.log(result)
        return result
    }
   
    function logError(args1, args2){

        const log = fs.createWriteStream(errorLog, { flags: 'a' });      
        
        let action = args1
        let logEvent
        
        switch(action){
            case 'moved':
                logEvent = `USERID:${args2.user_ID} ACTION:Moved JOBID:${args2.job_ID} TOLOCATION:${args2.shop_location} \n`
                break;
            case 'added':
                logEvent = `USERID:${args2.user_ID} ACTION:Added JOBID:${args2.job_ID} \n`
                break;
            case 'edited':
                logEvent = `USERID:${args2.user_ID} ACTION:Edited JOBID:${args2.job_ID} \n`
                break;
            case 'delete':
                logEvent = `USERID:${args2.user_ID} ACTION:Deactivated JOBID:${args2.job_ID} \n`
                break;
                default:
                    break;
        }
       
        
       log.write(logEvent)
       log.close()
       
    }
    function sendStatusToWindow(text) {
        //errLog.info(text)
        //log.info(text);
        //console.log(text)
        if(updateWin){
        updateWin.webContents.send('updater', text);
        }
      }



  ipcMain.on('resize-calendar',(event,args)=>{
      calendarWin.setSize(args[0],args[1],false)
  })
  /**
   * user maintenance
   */

   ipcMain.on('edit-users',(event,args,args2,args3)=>{

    let userID = args.id
    delete args.id

    console.log(args)
    console.log(userID)

    let k = Object.keys(args)
    let v = Object.values(args)
    let arrC = new Array()
    let arrV = new Array()
    let strColumns 
    let strValues 
    for(i=0;i<k.length;i++){
            
            arrC.push(`${k[i]}='${v[i]}'`)
            arrV.push(v[i])
    }
    if(arrC.length > 1){
    strColumns = arrC.join(',')
    }else{
        strColumns = arrC[0]
    }
    if(arrV.length > 1){
    strValues = arrV.join(',')
    }else{
        strValues =arrV[0]
    }
    
    let dboLocation = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
   
        
    

    console.log(strColumns)

    // //building placeholder for SQL based on amount of items in object
    // let columnPlaceholders = p.join("=?, ")
    // columnPlaceholders = columnPlaceholders+'=?'
    
    let sql = `UPDATE users SET ${strColumns} WHERE user_ID= ${userID}`;
    
    
    dboLocation.run(sql, function(err) {
        if (err) {
            return console.error(err.message);
        }
        cuWin.webContents.send('user-updated')
    }) 
    
    
    
    
    dboLocation.close()
         
    
    
})
  ipcMain.on('get-users', (event, from)=>{
      
    let dboUsers = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }        
    })
    let sql
    if(from=='login'){
    sql = `SELECT * FROM users WHERE active = 1 OR active = 'true'`
    }
    if(from=='useradmin'){
        sql = `SELECT * FROM users`
    }

        dboUsers.all(sql, [],function(err, row){
            if(err){
                console.log(err.message)
                return err
            }
            event.returnValue = row           
                       
        })
        dboUsers.close()
  })




  //TODO: if user exists add option to make user active again
  ipcMain.on('check-for-user', (event, args)=>{
      
    let dboUser = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        } 
    })
    let userName = args.toUpperCase()
    let sql = `SELECT user_ID FROM users WHERE UPPER(user_name) = ?`
    dboUser.all(sql, [userName],function(err, row){
        if(err){
            console.log(err.message)
            return err
        }
        
        if(row.length>0){
            event.returnValue = true
        }else{
            event.returnValue = false
        }
                    
                    
    })
    dboUser.close()

  })

  ipcMain.on('create-user',(event,args)=>{
      
    let dboUser = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        } 
    }) 
    let data = [args.user_name,args.role,1, args.password]
    let sql = 'INSERT INTO users(user_name,role,active,password) VALUES(?,?,?,?)'
    let sql2 = `SELECT *FROM users`
    dboUser.serialize(()=>{
    dboUser.run(sql, data, function(err) {
        if (err) {
          return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
      })
      .all(sql2,function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
           
            
            event.returnValue = row
        }
    })   

      
    })
    dboUser.close()
  })

  

  ipcMain.on('get-no-shows', (event, args)=>{
      
    let dboNoShow = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        } 
    })
    
    let sql = `SELECT * FROM jobs WHERE no_show = 1`
    dboNoShow.all(sql, function(err, row){
        if(err){
            console.log(err.message)
            return err
        }
        
        
            event.returnValue = row
        
                    
                    
    })
    dboNoShow.close()

  })

ipcMain.on('add-job', (event,args, args2, args3)=>{
    let objData =args
    let cn = args.customer_name;

    delete objData.customer_name

    let dboAddJob = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    //assign an array of key/column names for sql statement from the javascript object
    let p = Object.keys(objData)

    //assign an array of key/column values for sql statement from the javascript object
    let v = Object.values(objData)

    

    //building placeholder for SQL based on amount of items in object
    let columnPlaceholders = p.map((col) => '?').join(',');
    
    let sql = `INSERT INTO jobs(${p}) VALUES(${columnPlaceholders})`;
    
    //inserting single item into one table
    dboAddJob.run(sql,v, function(err){
        if(err){
            console.log(err.message)
        }else{
            
            let dboRefresh = new sqlite3.Database(workflowDB, (err)=>{
                if(err){
                    console.error(err.message)
                }
                
            })
            let sql2 = `SELECT * FROM jobs WHERE active = 1 AND cancelled = 0`
            dboRefresh.all(sql2, [],function(err, row){
                if(err){
                    console.log(err.message)
                    return err
                }
                
            
               
                
                
                dboAddJob.close()
                dboRefresh.close()
                addJobWin.close()
            })
            args.job_ID = this.lastID
            args.user = args2
            if(args3 == 'calendar'){
                calendarWin.webContents.send('refresh')
            }
            args.customer_name = cn
            logActivity('added',args)
            console.log(`${this.changes} items inserted at row: ${this.lastID}`)
    }
        
    }) 
    
    
    
})

ipcMain.on('db-contact-add', (event,args)=>{
    
    let dboContacts = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
    })
    let new_contact_ID
    let item_ID
    dboContacts.serialize(function(){
        //add contact
        let objCon = new Object()
        let objPhone = new Object()
        let objEmail = new Object()
        objCon.first_name = args.first_name
        objCon.last_name = args.last_name
        objCon.customer_ID = args.customer_ID
        if(args.primary_contact){
            objCon.primary_contact = args.primary_contact
        }
        objCon.active = 1

        let p = Object.keys(objCon)
        let v = Object.values(objCon)

         

        let columnPlaceholders = p.map((col) => '?').join(',');

        
        let sql = `INSERT INTO contacts(${p}) VALUES(${columnPlaceholders})`;
        
        dboContacts.run(sql,v, function(err){
            if(err){
                console.log(err.message)
            }
            
            new_contact_ID = this.lastID
            console.log(`${this.changes} items inserted at row: ${this.lastID} of contacts`)
            objPhone.p_contact_ID = this.lastID
            objEmail.e_contact_ID = this.lastID

            
            
            if(args.number != null){
                objPhone.number = args.number
                objPhone.active = 1
            
            p = Object.keys(objPhone)
            v = Object.values(objPhone)    
            columnPlaceholders = p.map((col) => '?').join(',');
            sql = `INSERT INTO phone_numbers(${p}) VALUES(${columnPlaceholders})`;    
            }else{
                
                v=0
                sql = 'SELECT * FROM phone_numbers WHERE phone_ID=? AND active=1'
            }
            dboContacts.run(sql,v, function(err){
                if(err){
                    console.log(err.message)
                }
                
                item_ID =  this.lastID
                console.log(`${this.changes} items inserted at row: ${this.lastID} of phone_numbers`)
                if(args.email !=null){
                    objEmail.email = args.email
                    objEmail.active = 1

                p = Object.keys(objEmail)
                v = Object.values(objEmail)
        
                columnPlaceholders = p.map((col) => '?').join(',');
                sql = `INSERT INTO emails(${p}) VALUES(${columnPlaceholders})`;    
                }else{
                    v=0
                    sql = 'SELECT * FROM emails WHERE email_ID =? AND active=1'
                }
                dboContacts.run(sql,v, function(err){
                    if(err){
                        console.log(err.message)
                    }
                    
                    item_ID =  this.lastID
                    console.log(`${this.changes} items inserted at row: ${this.lastID} of emails`)
                    event.returnValue = item_ID
                }) 
                
    
            }) 
            
            dboContacts.close()
        })
      
        
    })
    
    
})









/*******
 * functions regarding contacts
 *******/



ipcMain.on('db-get-contact',(event, args)=>{
    
    let dboContact = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    
    let sql = `SELECT * FROM contacts WHERE contact_ID = ?`
    dboContact.all(sql,[args],function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
            
            event.returnValue = row[0]
        }
        dboContact.close()
    })
    
    
})
ipcMain.on('db-get-phone',(event, args)=>{
    
    let dboPhone = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    
    let sql = `SELECT * FROM phone_numbers WHERE phone_ID = ?`
    dboPhone.all(sql,[args],function (err,row){
        if(err){
            console.log('first select'+err.message)
            return err
        }else{
            
            event.returnValue = row[0]
        }
        dboPhone.close()
    })
    
    
})
ipcMain.on('db-get-contact-name',(event, args1, args2)=>{
    
    let dboContactID = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let cmTable
    let cmColumn
    let cmID = args2
    if(args1 != null){
        if(args1 == 'phone'){
            cmTable = 'phone_numbers'
            cmColumn = 'phone_ID'
            secColumn = 'p_contact_ID'
            
        }else if(args1 == 'email'){
            cmTable = 'emails'
            cmColumn = 'email_ID'
            secColumn = 'e_contact_ID'
        }
    }
    
     
        
        let sql = `SELECT * FROM ${cmTable} WHERE ${cmColumn} = ${cmID}`
        dboContactID.all(sql,function (err,row1){
            if(err){
                console.log('first select'+err.message)
                return err
            }else{
                let dboContactName = new sqlite3.Database(workflowDB, (err)=>{
                    if(err){
                        console.error(err.message)
                    }
                    
                })
                let w
                let it
                
                if(cmTable == 'emails' && row1[0].e_contact_ID != 'null'){
                    w = row1[0].e_contact_ID
                    it = row1[0].email
                }else if(cmTable == 'phone_numbers'){
                    
                    w = row1[0].p_contact_ID
                    it = row1[0].number
                }
                let sql2 = `SELECT * FROM contacts WHERE contact_ID = ${w}`
                //let name
                //let where = row1.contact_ID
                dboContactName.all(sql2, function (err,row2){
                    if(err){
                        console.log('second select '+err.message)
                        return err
                    }else{
                       
                        let contactInfo = new Object()
                        contactInfo.first_name = row2[0].first_name
                        contactInfo.last_name = row2[0].last_name
                        contactInfo.item = it
                        contactInfo.customer_ID = row2[0].customer_ID                    
                        event.returnValue = contactInfo
                        dboContactID.close()

                    }
                    dboContactName.close()
                })
                
            }
                
            
            
        })
           
        
})

/******* 
*create browser windows
********/



function createMainWindow(){
    
    win = new BrowserWindow({
        width: 1620,
        height: 841,  
        hasShadow: false,   
        icon: path.join(__dirname, '../images/logo.ico'),
        autoHideMenuBar: true,
        
        
        
        
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false,
            enableRemoteModule: true,

        }
    })
    win.loadURL(url.format({
        pathname: path.join(__dirname, '../pages/workflow.html'),
        protocol: 'file',
        slashes:true
    }))
    
    win.on('ready', ()=>{
        
       
       
    })
    
    win.on('closed', ()=>{
        win = null
    })
    win.once('ready-to-show', () => {
        win.webContents.send('load-page')
        autoUpdater.checkForUpdates()
      })
    
    
}
function createUpdateWindow(args){
    updateWin = new BrowserWindow({
        width: 315,
        height: 315,        
        icon: path.join(__dirname, '../images/logo.ico'),
        autoHideMenuBar: true,
        frame: false,
        
        
        
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false,
            enableRemoteModule: true,

        }
    })
    updateWin.loadURL(url.format({
        pathname: path.join(__dirname, '../pages/updateMessage.html'),
        protocol: 'file',
        slashes:true
    }))
    
    updateWin.on('ready', ()=>{
        
       
       
    })
    
    updateWin.on('closed', ()=>{
        updateWin = null
    })
    updateWin.once('ready-to-show', () => {
        autoUpdater.checkForUpdates()
        updateWin.webContents.send('load-page')
        
      })
    
}
let editWindowCount = 0
function createEditWindow(args, args2, args3){
   
    editWindowCount++
    const opts = {  
        parent: win,
        width: 500,
        height: 950, 
                 
        autoHideMenuBar: true,
        modal: true,     
        icon: path.join(__dirname, '../images/icon.png'),
        
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false

        } 
    };
    
  if (BrowserWindow.getFocusedWindow()) {
      
    current_win = BrowserWindow.getFocusedWindow();
    const pos = current_win.getPosition();
    
    
    if(editWindowCount == 1){
        Object.assign(opts, {
            x: pos[0] + 200,
            y: pos[1] - 10,
            });
    }else{
    
        Object.assign(opts, {
            x: pos[0] + 175,
            y: pos[1] + 10,
            });
    }
    editWindowCount++
  };
  
        winEdit = new BrowserWindow(opts)
    
    
    winEdit.loadURL(url.format({
        pathname: path.join(__dirname, '../pages/edit.html'),
        protocol: 'file',
        slashes:true
        
    }))
    
    winEdit.on('ready', ()=>{
        
       winEdit.webContents.focus()
       
        
       
    })
    winEdit.on('focus', ()=>{
        
        
    })
    winEdit.once('ready-to-show', () => {
        winEdit.show()
        win.preventDefault
        
        
    })
    
    winEdit.webContents.focus()         
    winEdit.on('closed', ()=>{
        winEdit = null
        
    })
    winEdit.webContents.once('did-finish-load',()=>{
         
        let thisBW = BrowserWindow.fromId(winEdit.id)  
        
       thisBW.webContents.send('edit-data',args , args2, args3) 
               
    })
   
    
    
    
}
function createLoginWindow(){
    
    loginWin = new BrowserWindow({
        parent: win,
        width: 425,
        height: 250,
        autoHideMenuBar: true,
        modal: true,
        icon: path.join(__dirname, '../images/icon.png'),
        
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false
            
        }
    })
    loginWin.loadURL(url.format({
        pathname: path.join(__dirname, '../pages/login.html'),
        protocol: 'file',
        slashes:true
    }))
    //win.removeMenu()
    loginWin.on('ready', ()=>{
        loginWin.webContents.focus()
       
       
    })
    
    loginWin.on('closed', ()=>{
        loginWin = null
    })
    //win.webContents.openDevTools()
    
    
    
}
function createReportWindow(){
    
    reportWin = new BrowserWindow({
            parent: win,
            modal: true,
            width:900,
            height:550,
            autoHideMenuBar: true,
            show: true,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                contextIsolation: false,
                enableRemoteModule: true
    
            }
            
          })
          reportWin.loadURL(url.format({
            pathname: path.join(__dirname, '../pages/reports.html'),
            protocol: 'file',
            slashes:true
        }))
        reportWin.once('ready-to-show', () => {
            
            
          })

          reportWin.webContents.focus()
         
          
    
}

function createRestoreWindow(){
    
    restoreWin = new BrowserWindow({
            parent: win,
            modal: true,
            width:415,
            height:550,
            autoHideMenuBar: true,
            show: true,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                contextIsolation: false,
                enableRemoteModule: true
    
            }
            
          })
          restoreWin.loadURL(url.format({
            pathname: path.join(__dirname, '../pages/restoreDB.html'),
            protocol: 'file',
            slashes:true
        }))
        restoreWin.once('ready-to-show', () => {
            
            
          })

          restoreWin.webContents.focus()
         
          
    
}
function createAddJobWindow(args, launcher){
    addJobWin = new BrowserWindow({
            parent: win,
            modal: true,            
            width:570,
            height: 950,
            
            autoHideMenuBar: true,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                contextIsolation: false
    
            }
            
          })
          addJobWin.loadURL(url.format({
            pathname: path.join(__dirname, '../pages/addJob.html'),
            protocol: 'file',
            slashes:true
        }))
        addJobWin.once('ready-to-show', () => {
            addJobWin.show()
            win.preventDefault
            //attachDatePicker()
            
        })
        addJobWin.webContents.once('did-finish-load',()=>{
            addJobWin.webContents.send('user-data', args, launcher)            
        })
        //addJobWin.webContents.openDevTools()
        addJobWin.webContents.focus()  
               
        addJobWin.on('closed', ()=>{
            addJobWin = null
        })
        
    
}
function createCreateUserWindow(){
        cuWin = new BrowserWindow({
        parent: win,
        modal: true,
        width:540,
        height: 650,//w425 h300
        autoHideMenuBar: true,
        show: false,
        icon: path.join(__dirname, '../images/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false

        }
        
      })
      cuWin.loadURL(url.format({
        pathname: path.join(__dirname, '../pages/createUser.html'),
        protocol: 'file',
        slashes:true
    }))
    cuWin.once('ready-to-show', () => {
        cuWin.show()
        
        
      })
}
function createContactsWindow(args1, args2, args3, args4, args5,args6,args7,args8){
    contactWin = new BrowserWindow({
            parent: win,
            modal: false,            
            width:550,
            height: 650,
            
            autoHideMenuBar: true,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                contextIsolation: false
    
            }
            
          })
          contactWin.loadURL(url.format({
            pathname: path.join(__dirname, '../pages/contacts.html'),
            protocol: 'file',
            slashes:true
        }))
        contactWin.once('ready-to-show', () => {
            //contactWin.webContents.openDevTools()
            contactWin.show()
            contactWin.preventDefault
            //attachDatePicker()
            
          })

        contactWin.webContents.focus()
         
        contactWin.webContents.once('did-finish-load',()=>{
            contactWin.webContents.send('name-chosen', args1, args2, args3, args4, args5,args6,args7,args8)            
        })

        contactWin.on('closed', ()=>{
            contactsWin = null
            win.focus()
        })
        
    
}
function createCalendarWindow(args,args2){
    calendarWin = new BrowserWindow({
            parent: win,
            modal: true,
            width:1087,//1140
            height: 477,//600
            autoHideMenuBar: true,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                contextIsolation: false
    
            }
            
          })
          calendarWin.loadURL(url.format({
            pathname: path.join(__dirname, '../pages/calendar.html'),
            protocol: 'file',
            slashes:true
        }))
        calendarWin.once('ready-to-show', () => {
            calendarWin.show()
            //win.preventDefault
            //attachDatePicker()
            
          })

          calendarWin.webContents.focus()
         
         calendarWin.on('closed', ()=>{
            calendarWin = null
        })
        
        calendarWin.webContents.once('did-finish-load',()=>{
            calendarWin.webContents.send('opened',args,args2)
        })
       
    
}
ipcMain.on('reset-edit-window-count',(event,args)=>{
    editWindowCount = 0
})
ipcMain.on('close-window', (event,args)=>{
    let who = event.sender.getTitle()
    let which = BrowserWindow.fromId(event.sender.id)
    
    if(which) {
        console.log(which.id)
         which.close()
         return
    }
    switch(who){
        case 'Edit Job':
            winEdit.close()
            break;
        case 'Add Job':
            addJobWin.close()
            break;
    }
})
ipcMain.on('delete-scheduled', (event,args,args2)=>{
    let objChange = new Object()
    objChange.job_ID = args
    objChange.user = args2
    let db = new sqlite3.Database(workflowDB, (err) => {
        if (err) {
          console.error(err.message);
        }
      });
      
      let id = args;
      // delete a row based on id
      db.run(`UPDATE jobs SET cancelled = 1  WHERE job_ID=?`, id, function(err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`Row(s) deleted ${this.changes}`);
        logActivity('delete', args)
      });
      
      // close the database connection
      db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
      });
})
ipcMain.on('close-add-window', (event,args)=>{
    addJobWin.close()
})
ipcMain.on('open-add-job',(event, args,launcher)=>{
    createAddJobWindow(args, launcher)
})
ipcMain.on('edit', (event, args)=>{    
    
    edit(args)  
     
});

// ipcMain.on('message', (event)=>{
    
//     event.sender.send('message',objList)
    
// });
ipcMain.on('open-edit',(event,args, args2,args3)=>{
    //console.log('open-edit')
    //console.log(args)
    createEditWindow(args, args2,args3)
})

// ipcMain.on('get-users', (event,args)=>{
//     let dboUsers = new sqlite3.Database(workflowDB, (err)=>{
//         if(err){
//             console.error(err.message)
//         }
        
//     })

//     let sql = `SELECT * FROM users WHERE active=1`
//     dboUsers.all(sql,[], (err, row)=>{
//         if(err){
//             return err
//         }else{
            
//             event.returnValue = row
//         }
//         dboUsers.close()
//     })
    
    
// })

 
 
ipcMain.on('delete-user', (event,args)=>{
    let dboUsers = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    }) 
    dboUsers.serialize(()=>{

    
        let sql = `UPDATE users SET active = 0 WHERE user_ID = ?`
        let sql2 = `SELECT * FROM users WHERE active = 1`
    
        dboUsers.run(sql,[args], function (err, row){
            if(err){
                return err
            }else{
                
                
            }
    
    
        })
        .all(sql2,[], function (err,row2){
            if(err){
                return err
            }else{
                
                event.returnValue = row2
            }
        })
        dboUsers.close()
    })
    
    
})

// ipcMain.on('reloadPage', (event) =>{
   
//     event.sender.send('reload', objList)
// })


ipcMain.on('deactivate', (event,args, args2)=>{
    let objChange = new Object()
    objChange.job_ID = args
    objChange.user = args2

    let dboDeactivate = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    dboDeactivate.serialize(()=>{

    
        let sql = `UPDATE jobs SET active = 0 WHERE job_ID = ?`
        let sql2 = `SELECT * FROM jobs WHERE active = 1`

        dboDeactivate.run(sql,[args], function (err, row){
            if(err){
                return err
            }else{
                
                
            }


        })
        .all(sql2,[], function (err,row2){
            if(err){
                return err
            }else{
                
                event.returnValue = row2
                logActivity('delete',objChange)
            }
        })
        dboDeactivate.close()
    })
    
    
})
/*****
 * ****
 * communication regarding company
 * ****
 */











ipcMain.on('add-new-customer', (event,args)=>{
    let dboCustomer = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    sql = `INSERT INTO customers(customer_name) VALUES (?)`
    dboCustomer.run(sql,args.toUpperCase(), function(err){
        if(err){
            console.log(err.message)
        }
        event.returnValue = this.lastID
        console.log(`${this.changes} items inserted at row: ${this.lastID}`)
    }) 
    dboCustomer.close()
})









/*used to pull names for dropdown datalist of names when adding jobs or contacts*/
ipcMain.on('get-customer-names', (event,args)=>{
    //create database object that autoconnects to database
    let dboCustomers = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    //make sql query for dboContacts
    let sql = `SELECT * FROM customers`
    dboCustomers.all(sql,[], function (err, row){
        if(err){
            return err
        }else{
            
            event.returnValue = row
        }
        dboCustomers.close()
    })
    
    
    
        
})
ipcMain.on('refresh-add-page', (event,args,args2,args3)=>{
    //contactWin.close()
    //contactWin = null
    addJobWin.webContents.send('refresh', args,args2,args3)
    addJobWin.show()
    addJobWin.focus()
    
    
    
    
})
let r
let dbCallBack = (data)=>{
    r = data[0].customer_ID
    return data[0].customer_ID
}
ipcMain.on('get-customer-ID', (event,args)=>{
    let dboCustomers = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    var data = []
    //make sql query for dboContacts
    let sql = `SELECT customer_ID FROM customers WHERE UPPER(customer_name) =?`
    console.log(args)
    dboCustomers.all(sql,args.toUpperCase(), function (err, row){
        
        if(err){
            return err
        }
            
            if(row.length>0){
            event.returnValue =row[0].customer_ID
            }else{
                event.returnValue = false
            }
            //return row[0].customer_ID
            
            
            dboCustomers.close()

    })
    
    
})

/****************************
 * communications regarding contacts
 ***************************/


ipcMain.on('open-contacts', (event,args1,args2, args3, args4, args5, args6, args7,args8)=>{
    //test to see which page launched the contacts page
    //right now the options are 'add job page' from addJob.js and 'main page' from index.js
    if(args1 == 'add job page'){
        let dboCustomers = new sqlite3.Database(workflowDB, (err)=>{
            if(err){
                console.error(err.message)
            }
            
        })
        var data = []
        //make sql query for dboContacts
        let sql = `SELECT customer_ID FROM customers WHERE UPPER(customer_name) =?`
        
        dboCustomers.all(sql,args2.toUpperCase(), function (err, row){
            
            if(err){
                return err
            }
            
            createContactsWindow(args1,args2, args3, args4,args5,row[0].customer_ID,args7,args8)        
   
                return row[0].customer_ID
                
            
                dboCustomers.close()
    
        })
        
        
    }
    
         createContactsWindow(args1,args2, args3, args4,args5,args6,args7,args8)        
    
})


ipcMain.on('move', (event, args)=>{
    
    switch(event.sender.getTtitle()){
        case 'Edit Job':
            winEdit.close();
            break;
        default:
            break;
    }
   
})
ipcMain.on('pass-contact', (event,args, args2)=>{
    
    
    winEdit.webContents.send('contacts-updated',args, args2)
    contactWin.close()
})

ipcMain.on('get-contacts', (event, args)=>{
    
    let insertCount = 0
    if(args != undefined){
        let dboContacts = new sqlite3.Database(workflowDB, (err)=>{
            if(err){
                console.error(err.message)
            }
            
        })
        dboContacts.serialize(function(){
        //make sql query for dboContacts
        let sql = `SELECT DISTINCT contacts.*, phone_numbers.phone_ID, phone_numbers.number, emails.email_ID, emails.email
        FROM contacts 
        LEFT JOIN phone_numbers ON contacts.contact_ID = phone_numbers.p_contact_ID
        LEFT JOIN emails ON contacts.contact_ID = emails.e_contact_ID        
        WHERE contacts.customer_ID=${args}`;
        let sqltest = `SELECT * FROM contacts WHERE customer_ID = ${args}
        UNION 
        SELECT * FROM contacts, phone_numbers WHERE p_contact_ID = contacts.contact_ID
        UNION
        SELECT * FROM contacts, emails WHERE e_contact_ID = contacts.contact_ID`
        let sql1 = `SELECT * FROM contacts WHERE customer_ID=${args} AND active=1`
        
            dboContacts.all(sql1,[], function (err, row){
                if(err){
                    console.log(err)
                    return err
                }else{
                    
                    if(row.length>0){
                    for(let member in row){
                    let sql2 = `SELECT * FROM phone_numbers WHERE EXISTS (SELECT p_contact_ID FROM phone_numbers) AND p_contact_ID = ${row[member].contact_ID} AND active=1`
                        dboContacts.all(sql2,[], function (err, row2){
                            if(err){
                                console.log(err)
                                return err
                            }else{
                                
                            
                                let sql3 = `SELECT * FROM emails WHERE EXISTS (SELECT e_contact_ID FROM emails) AND e_contact_ID = ${row[member].contact_ID} AND active=1`
                                dboContacts.all(sql3,[], function (err, row3){
                                    if(err){
                                        console.log(err)
                                        return err
                                    }else{
                                        
                                        
                                            if(row2.length){
                                                row[member].phonenumbers = row2
                                            }
                                            if(row3.length){
                                                row[member].emails = row3
                                            }
                                            let packagedData = new Array()
                                            packagedData = row
                                            insertCount++
                                              if(insertCount==row.length){

                                                
                                                 
                                                event.returnValue = row
                                                
                                            
                                            event.sender.send('set-contacts', row)
                                            dboContacts.close()
                                            }
                                        
                                    }
                            
                                }) 
                                
                            }   
            
                            
                        
                
                        })//end second .all
                    }//end for loop
                    }else{
                        event.returnValue = false
                    }
                }//end second .all else phone
        
            })//end first .all    
        })//end serialize
        
    }//end main if
   
})
ipcMain.on('edit-phone', (event,args)=>{
    let dboPhone = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let data = [args.text, args.id]
    
    let sql = `UPDATE phone_numbers
            SET number = ?
            WHERE phone_ID = ?`;
    dboPhone.run(sql, data, function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        dboPhone.close() 
        });
          
})

ipcMain.on('edit-email', (event,args)=>{
    let dboEmail = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let data = [args.text, args.id]
   
    let sql = `UPDATE emails
            SET email = ?
            WHERE email_ID = ?`;
    dboEmail.run(sql, data, function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        dboEmail.close() 
        }); 
         
})
ipcMain.on('edit-primary-contact', (event, args1, args2)=>{
    let dboCN = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })

    let sql = `UPDATE contacts SET primary_contact = ${args1} WHERE contact_ID = ${args2}`
    console.log(sql)
    dboCN.run(sql, function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        
        dboCN.close() 
        });  
})
ipcMain.on('edit-contact-name', (event,args)=>{
    let dboCN = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let cid = args.contact_ID
    delete args.contact_ID
    let arrC =new Array()
    let k = Object.keys(args)
    let v = Object.values(args)

    for(i=0;i<k.length;i++){
            
        arrC.push(`${k[i]}='${v[i]}'`)
        //arrV.push(v[i])
    }
    if(arrC.length > 1){
    strColumns = arrC.join(',')
    }else{
        strColumns = arrC[0]
    }
    console.log(strColumns)
    let data = [args.fn, args.ln,args.cid]
   
    let sql = `UPDATE contacts
            SET first_name = ?,
            last_name = ?
            WHERE contact_ID = ?`;
    let sql2 = `UPDATE contacts SET ${strColumns} WHERE contact_ID = ${cid}`
    dboCN.run(sql2, function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        dboCN.close() 
        });  
        
})
ipcMain.on('add-phone', (event,args)=>{
    let dboNewPhone = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let objAdd = new Object()
    objAdd.p_contact_ID = args.contact_ID
    objAdd.number = args.text
    objAdd.active = args.active
     //assign an array of key/column names for sql statement from the javascript object
     let p = Object.keys(objAdd)

     //assign an array of key/column values for sql statement from the javascript object
     let v = Object.values(objAdd)
 
    
 
     //building placeholder for SQL based on amount of items in object
     let columnPlaceholders = p.map((col) => '?').join(',');
     
     let sql = `INSERT INTO phone_numbers(${p}) VALUES(${columnPlaceholders})`;
     
     //inserting single item into one table
     dboNewPhone.run(sql,v, function(err){
         if(err){
             console.log(err.message)
         }
         console.log(`${this.changes} items inserted at row: ${this.lastID}`)
         dboNewPhone.close()
        }) 
        
     //end insert
    
         
})
ipcMain.on('add-email', (event,args)=>{
    let dboNewEmail = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let objAdd = new Object()
    objAdd.e_contact_ID = args.contact_ID
    objAdd.email = args.text
    objAdd.active = args.active
     //assign an array of key/column names for sql statement from the javascript object
     let p = Object.keys(objAdd)

     //assign an array of key/column values for sql statement from the javascript object
     let v = Object.values(objAdd)
 
    
 
     //building placeholder for SQL based on amount of items in object
     let columnPlaceholders = p.map((col) => '?').join(',');
     console.log(columnPlaceholders)
     
     let sql = `INSERT INTO emails(${p}) VALUES(${columnPlaceholders})`;
     
     //inserting single item into one table
     dboNewEmail.run(sql,v, function(err){
         if(err){
             console.log(err.message)
         }
         console.log(`${this.changes} items inserted at row: ${this.lastID}`)
         dboNewEmail.close()
        }) 
        
     //end insert
    
         
})
//ipcMain.on('deactivate-contact')

//handler to delete items (phone number, email,, contact or any variation of the three) from contacts
ipcMain.on('delete-item', (event,args)=>{
    console.log(`args.method in 'delete-item' is ${args.method}`)
    let dboDelPhone = new sqlite3.Database(workflowDB, (err)=>{
        if(err){
            console.error(err.message)
        }
        
    })
    let sql
    let id
    
    if(args.method == 'p'){
        
        sql = `UPDATE phone_numbers SET active=0 WHERE phone_ID=?`
    }
    if(args.method == 'e'){
        sql = `UPDATE emails SET active=0 WHERE email_ID=?`
    }
    if(args.method =='c'){
        sql = `UPDATE contacts SET active=0 WHERE contact_ID=?`
        sql2 = `UPDATE phone_numbers SET active=0 WHERE p_contact_ID=?`
        sql3 = `UPDATE emails SET active=0 WHERE e_contact_ID=?`
        id = args.contact_ID

        dboDelPhone.run(sql2, id, function(err) {
            if (err) {
              return console.error(err.message);
            }
            console.log(`Phone number deleted ${this.changes}`);
    
            
          }); 
          dboDelPhone.run(sql3, id, function(err) {
            if (err) {
              return console.error(err.message);
            }
            console.log(`Emails deleted ${this.changes}`);
    
            
          });    
    }else{
    id = args.methodID
    }
    dboDelPhone.run(sql, id, function(err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`Contacts deleted ${this.changes}`);
        dboDelPhone.close()
        
      });
     
      
})

/************
 * communications regarding users and login
 ************/
ipcMain.on('open-create-user', (event,args)=>{
    createCreateUserWindow()
})


ipcMain.on('login-success',(event, args)=>{
    
    if(args.role == 'admin'){
     win.webContents.send('show-admin-elements', args)
    }else{
        win.webContents.send('show-user-elements', args)
      
    }
    loginWin.hide()
    loginWin.close()
    loginWin = null
})


ipcMain.on('open-login-window', function(){
    createLoginWindow()
})

/********
 * communications regarding reports
 ********/
 const shell = electron.shell
 const os = require('os')

ipcMain.on('open-report-window',(event,args)=>{
    createReportWindow()
}) 

ipcMain.on('open-restore', (event,args)=>{
    createRestoreWindow()
})

ipcMain.on('print-to-pdf', function (event) {
    try{
            console.log('print-to-pdf called')
            
            const pdfPath = path.join(os.homedir(), 'Documents', 'temp.pdf')
            const win = BrowserWindow.fromWebContents(event.sender)
            win.webContents.printToPDF({scaleFactor: 75}).then(data => {
                fs.writeFile(pdfPath, data, (error) => {
                if (error) throw error
                shell.openExternal('file://' + pdfPath)
                console.log(`Wrote PDF successfully to ${pdfPath}`)
                })
                
            }).catch(error => {
                console.log(`Failed to write PDF to ${pdfPath}: `, error)
            })
            
            
        }catch(e){
            console.log(e)
        }
        reportWin.webContents.send('close-window')
})

ipcMain.on('pull-activity-log', (event, args1, args2, args3)=>{
    
    try{
       
        let list
        if(args3 ===true){
            list= fs.readFileSync(`${logLocation}activityLog${args2}.txt`, 'UTF-8');
        }else{
            list= fs.readFileSync(`${logLocation}${args1}\\${args2}\\activityLog.txt`, 'UTF-8');
        }
         event.returnValue = list
    }catch(err){
        //console.log(err)
        event.returnValue = "no file exists"
    }
})

/********
 * ******
 * communications regarding calendar
 * ******
 ********/
ipcMain.on('open-calendar',(event,args,args2)=>{
    
    createCalendarWindow(args,args2)
   
})  

ipcMain.on('get-version', (event)=>{
    event.returnValue = app.getVersion()
})

async function backupDB(){
    let today = false
    

    


        let current = new Date()
        let currentTime = current.toLocaleTimeString('en-US',{hourCycle:'h23'})
        let hour = current.getHours()
        console.log(currentTime)
        console.log(current.getHours())
        let whichDB = ""
        try{
        switch(hour){
            case 7:
                whichDB = 'v:/backup/backup07.db'
                break;
            case 8:
                whichDB = 'v:/backup/backup08.db'
                break;
            case 9:
                whichDB = 'v:/backup/backup09.db'
                break;
            case 10:
                whichDB = 'v:/backup/backup10.db'
                break;
            case 11:
                whichDB = 'v:/backup/backup11.db'
                break;
            case 12:
                whichDB = 'v:/backup/backup12.db'
                break;
            case 13:
                whichDB = 'v:/backup/backup13.db'
                break;
            case 14:
                whichDB = 'v:/backup/backup14.db'
                break;
            case 15:
                whichDB = 'v:/backup/backup15.db'
                break;
            case 16:
                
                whichDB = 'v:/backup/backup16.db'
                break;
           default:
               whichDB = 'v:/backup/backup20.db'
                break;
        }
    }catch(e){
        errLog.info(e)
    }
    
    const objStats = await fsp.stat(whichDB).catch(e =>{
         errLog.info(e)
         
    })
    if(objStats){
        //let whichDB = (currentTime > '11:06:00 PM')?'v:/backup1.db':'v:/backup2.db'
        console.log(current.toLocaleTimeString('en-US',{hourCycle:'h23'}))
        
        
        //let objStats = new Object()
        
            
            let date = new Date();
            today = (objStats.mtime.getDate() == date.getDate())? true :false
            
        // if(fs.existsSync(whichDB)){
        //     objStats = fs.statSync(whichDB)
        //     // fs.statSync(whichDB, (err, stats) => {
        //     //     if(err) {
        //     //         console.log(err)
        //     //         throw err;
        //     //     }
        //     //     let date = new Date();     
        //     //     console.log('day modified = '+stats.mtime.getDate());       
        //     //     today = (stats.mtime.getDate() == date.getDate())? true :false
        //     //     console.log('filewas modified today = '+today)
                
                
        //     // });
        //     let date = new Date();
        //     today = (objStats.mtime.getDate() == date.getDate())? true :false
        // }
        errLog.info('already modified today = '+today)
    }
        if(!today){
            try{
                let dboBackup = new sqlite3.Database(workflowDB, (err)=>{
                    if(err){
                        console.error(err.message)
                    }
                    
                })
                let backup=dboBackup.backup(whichDB)
                let NPAGES = -1
                let h = setInterval(() => {
                    
                    //console.log(backup.idle)
                    if(backup.idle){
                        NPAGES++
                        backup.step(backup.pageCount)
                        console.log('page count = '+backup.pageCount)
                        console.log('pages remaining = '+backup.remaining)
                        
                    }
                    if(backup.completed || backup.failed){
                        clearInterval(h)
                        console.log(backup.pageCount)
                        console.log('completed = ' +backup.completed)
                        console.log('failed = '+backup.failed)
                        backup.finish()
                        
                        dboBackup.close()
                    }
                
                }, 250);
            }catch(e){
                errLog.info(e)
            }
        
        }else{
        //dboBackup.close()
        }
        setTimeout(() => {
            backupDB()
            
        }, 3600000);
    
}
    
    