let quizOrLink;
let whichButtonclicked;
let msgNotif;
let titleNotif;


// this function checks if there is any message from the content script
// the message indicates that the user has input data to a password field
// and so it generates a chrome notificaion
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // console.log("Received");

        let pers;
        // takes data from chrome storage
        chrome.storage.sync.get({ favoriteColor: 'red'}, (items) => {
            
            pers = items.favoriteColor;

            // decide the color of the icon
            if (pers[0] =="E" && pers[2] =='T') {
                //Extroverted thinkers are red
                imgUrl = 'assets/red.png';
            } 
            else if (pers[0] =="E" && pers[2] =='F') {
                //extroverted feelers are yellow
                imgUrl = 'assets/yellow.png';
            }
            else if (pers[0] =="I" && pers[2] =='T') {
                //introverted thinkers are blue
                imgUrl = 'assets/blue.png';
            }
            else if (pers[0] =="I" && pers[2] =='F') {
                //introverted feelers are green
                imgUrl = 'assets/green.png';
            }
            else {
                imgUrl = 'assets/icon.png'
            }; 

            // decide title for intuitiing vs sensing, possibilites vs dry facts
            if (pers[1] =='N') {
                titleNotif = "Improve your password";
            } 
            else {
                titleNotif = "Password field detected";
            }; 
            
            // decide message for thinkers or feelers
            if (pers[2] =='T') {
                msgNotif = "30% of internet users have experienced a data breach due to a weak password.";
            } 
            else {
                msgNotif = "Why do you think the most commonly used password is 123456? 🤔";
            }; 


            // decide if quiz or link offered, 
            if (pers[3] =='J') {
                //quiz for perceiving 
                quizOrLink = 'l';
                msgNotif = msgNotif + " \nClick the button to see instructions.";
            } 
            else {
                quizOrLink = 'q';
                msgNotif = msgNotif + " \nClick the button to take a quiz on passwords.";
            }; 
            
            //notification
            chrome.notifications.create('',{
            type: 'basic',
            iconUrl: imgUrl,
            title: titleNotif,
            message: msgNotif,
            buttons: [{ title: 'Lets Have a look.' }, 
                      {title: 'Ignore'}]
            }, function(id) {
                whichButtonclicked = id;
            }
        
        );

        });

      if (request.greeting === "hello")
        sendResponse({farewell: "goodbye"});
    }
);
  
// this function sends a messgae to the content script depending on which button is clicked
// for the chrome notificaton above, link or quiz depends on personality type set
chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
    console.log("button clicked");
    if (notifId === whichButtonclicked) {
        console.log("quiz or Link",quizOrLink);
        console.log("button",whichButtonclicked);
        if (btnIdx === 0 ) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {action: quizOrLink}, function(response) {});  
            });
        }
    }
});
