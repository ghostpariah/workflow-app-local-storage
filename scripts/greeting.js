class Greeting{
    constructor(){
        this.main = ()=>{
            let greetingContainer = document.createElement('div')
            return greetingContainer
        }
        this.greeting =
         `<div class='welcome'>Welcome!</div>`
         this.headline = 
         `<h1>What's New?</h1>`
        this.headlineContent =
        `<div id='headlineContent'>
        <ul>
            <li>Log In Feature</li>
            <li>New Design</li>
            <li>Saved Customer Info</li>
            <li>Contact Section</li>
            <li>View Customer's Past Jobs </li>
        </ul>
        </div>
            `
         this.tail = `</div>`

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