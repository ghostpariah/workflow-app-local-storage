![Logo](/images/logo.svg)
# Overview
Workflow App is an application created for managing the workflow of truck repair jobs and customer information at Frame & Spring, Inc.

- Scheduling
- Job Status
- Customer History
- Customer Contacts
- Reporting 

Data (logs, database, and text file for whiteboard) is stored on a network drive accessible by all computers. A network drive labeled v: must be mapped in order to function. If using to sample program on a local machine, comment out current rootStorage variable and uncomment the app.getPath defined variable.
```javascript
const rootStorage = app.getPath('userData')
//const rootStorage = 'v:/'
```
### Technology Used
- Javascript
- Node.js
- Electron
- SQLite3
- HTML
- CSS
