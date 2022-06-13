class Splash{
    constructor(version){
        this.version = version
        this.head = `<div id='open-content'>`
        this.greeting =
         `<div class='welcome'>Welcome!</div>`
         this.headline = 
         `<h1>What's New in version ${this.version}?</h1>`
        this.headlineContent =
        `<div id='headlineContent'>
        
        <ul>
            <li>New Design</li>
            <li>User Log In</li>            
            <li>Customer Contacts</li>
            <li>Reports
                <ul>
                    <li>User Activity</li>
                    <li>No Shows</li>
                    <li>EOD</li>
                    <li>Company Job History</li>
                </ul>
            </li>
            <li>Automatic Updates</li>
        </ul>
        </div>
            `
         this.tail = `</div>`
         

         

    }
    setVersion(v){

           this.version = v;
    }
     getGreeting(){
        return this.head+
        this.greeting + 
        this.headline+
        this.headlineContent+
        this.tail
     }
     setGreeting(){
         
     }
}



