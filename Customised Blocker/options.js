// // Saves personality options options to chrome storage
// const saveOptions = () => {
//   const color = document.getElementById('color').value;

//   chrome.storage.sync.set(
//     { favoriteColor: color},//, likesColor: likesColor },
//     () => {
//       // Update status to let user know options were saved.
//       const status = document.getElementById('status');
//       status.textContent = 'Options saved.';
//       setTimeout(() => {
//         status.textContent = '';
//       }, 750);
//     }
//   );
// };

// // Restores preferences stored in chrome's storaeg
// const restoreOptions = () => {
//   chrome.storage.sync.get(
//     { favoriteColor: 'red'},
//     (items) => {
//       document.getElementById('color').value = items.favoriteColor;
//     }
//   );
// };


// this section communicates with the Heroku server each time text is written and process is clicked
const form = document.getElementById('data_block');

// form.addEventListener('submit', async (event) => {

//   event.preventDefault();
//   const input = document.getElementById('the_data').value;

//   const selectData = document.getElementById('color');

//   //check if there is Data in input box
//   if (input=="") {
//     const resultDiv = document.getElementById('result');
//     resultDiv.innerText = "No Text Available";
//   } else {

//     try {
  
//       const response = await fetch('https://flask-project-online-d114d91f2d99.herokuapp.com/predict', {
//       // const response = await fetch('http://localhost:5000/predict', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({text: input}),
//       });

//       if (response.ok) {
//         const prediction = (await response.json()).prediction;
//         const resultDiv = document.getElementById('result');
//         resultDiv.innerText = "Congratulations your personality type is " + prediction;
//         selectData.value = prediction;
//       } else {
//         console.error('Request failed:', response.status);
//       }
//     } catch (error) {
//       console.error('Request failed:', error);
//     }
//   }
// });



// indexDB code source: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
// this might be easier to understand: https://www.tutorialspoint.com/indexeddb/indexeddb_object_stores.htm#:~:text=Object%20stores%20are%20the%20data,data%20we%20want%20to%20store.


//Sample success and error
const request = indexedDB.open("Block_List",4);
request.onerror = function(event) {
  alertFunction("There is an error");
}

//sample data to enter into our noSQL table
const sampleData = [
  {name: "www.youtube.com", hardBlock: "Yes"},
  {name: "www.reddit.com", hardBlock: "No"},
];

// triggers each time a database version is updated or a fresh database, that did not exist in memory, is created
request.onupgradeneeded = function(event) {

  //since request is opening indexDB, that target result is an indexDB instance
  const db = event.target.result;
  // create the table as an instance and specify the primary key
  // const objectStore = db.createObjectStore("Block_List_instance",{keyPath:"id"});
  //or use a keygenerator
  const objectStore = db.createObjectStore("Block_List_instance",{autoIncrement: true});


  // must create a manual index to search through website name, index is named after the column
  // technically you shouldn't block the same website twice so mayebe the index should be unique
  objectStore.createIndex("name","name",{unique: false});
  //unique true means it cannot have duplicates
  objectStore.createIndex("hardBlock","hardBlock",{unique: false});
  objectStore.createIndex("softBlock","softBlock",{unique: false});


};


function addhardBlockASite(keyValue,priority,websiteUrl) {
  //look into inject a script that unregisters service workers in a site and prevents it from being registered
  // first remove the rule and then add, just to ensure any duplicate rules are removed before being added
  // since this effectively is a check box in the dialog box
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: [keyValue],
      addRules: 
      [
        {
          "id": keyValue,
          "priority": priority,
          "action": {
            "type":"block" ,
          },
          "condition": {
            "initiatorDomains": [websiteUrl],
            "resourceTypes": ["csp_report", "font", "image", "main_frame", "media", "object", 
                            "other", "ping", "script", "stylesheet", "sub_frame", 
                            "webbundle", "websocket", "webtransport","xmlhttprequest"]
          }
        }
      ]
      
  });

};

function returnMaxKeyValue() {
  // return the max value of all keyValues/ Primary key in our indexedDB table as a Promise
  return keyPromeise = new Promise(function(resolve,reject) {
    let keyValue = 0;
    const request = indexedDB.open("Block_List",4);
    request.onsuccess = function(event) {
      db = event.target.result;
      objectStore = db.transaction("Block_List_instance").objectStore("Block_List_instance");
      objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
          cursor.continue();
          keyValue = cursor.key;
        } else {
          resolve(keyValue);
        }
      };
    };
  });
};

function removeHardBlockASite(keyValue) {
  // remove blocked site using the rule id
  // key value of indexedDB table is used as the ruleid to be removed
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: [keyValue]
  });
};


// keep adding the same data again and again when button is clicked
// this function should be removed when testing is over
function addDataToDB() {
  const request = indexedDB.open("Block_List",4);
  request.onsuccess = function(event) {
      db = event.target.result;
      transaction = db.transaction(["Block_List_instance"],"readwrite");
      const objectStore = transaction.objectStore("Block_List_instance");
      sampleData.forEach((entry) => {
        objectStore.add(entry);
    });
  }
  displayData();
};

function addRowtoDB(rowArray) {
  // adds a new row to the DB, data is input as an array
  const request = indexedDB.open("Block_List",4);
  request.onsuccess = function(event) {
    db = event.target.result;
    const objectStore = db.transaction(["Block_List_instance"],"readwrite").objectStore("Block_List_instance");
    const request = objectStore.add(rowArray[0]);
    request.onsuccess = async function(event) {
      //first we add a hard block if hard block is yes 
      if (rowArray[0].hardBlock === "Yes") {
        // when we create a new row with a indexedDB, we don't have access to 
        // the primary key or keyValue, we a new row is created, we open a cursor check the largest value
        // because a new row will always have the largest value with autoIncreement and then 
        // hard block using the funciton addhardBlockASite
        maxKeyValue = await returnMaxKeyValue();
        await addhardBlockASite(maxKeyValue,1,rowArray[0].name);
      }
      //then close the dialog box from here just so that we don't need to refresh the dialog box with other details 
      // perhaps we should return a promise and then display buttons but that is a complicaton for a future time
      document.getElementById("data-Entry-dialog").close();
      displayData();
    }
  };
};

function addRowToDBInDialog() {
  //executes function addRowtoDB in the dialog box
  // I intially did this to remove an event listener because a event listener funciton was running multiple times
  // but making it a function seems to have solved the problem??
  const idElem = document.getElementById('key-id');
  const nameElem = document.getElementById('name-db');
  const hardBlockElem = document.getElementById('hard-block');
  const softBlockElem = document.getElementById('soft-block');
  // create array with object
  const insertArray = [{name:nameElem.value,hardBlock:hardBlockElem.value,softBlock:softBlockElem.value}];
  addRowtoDB(insertArray);
};

function getDatafromDB(keyValue) {
  // function returns an array of data from the DB which has the input key value
  // returns a promise to ensure the data waits for the array to be returned
  // before putting those values in the form
  return myPromise =  new Promise(function(resolve,reject) {
    const request = indexedDB.open("Block_List",4);
      request.onsuccess = function(event) {

      db = event.target.result;
      // read only is the default
      transaction = db.transaction(["Block_List_instance"]);
      const objectStore = transaction.objectStore("Block_List_instance");
      const request2 = objectStore.get(keyValue);

      request2.onsuccess = function(event2) {
        returnArray = [request2.result.name,request2.result.hardBlock,request2.result.softBlock];
        resolve(returnArray);
      }; 
   };
  });
};

function deleteDatafromDB(keyValue) {
  const request = indexedDB.open("Block_List",4);
  request.onsuccess = function(event) {
    db = event.target.result;
    const request = db.transaction(["Block_List_instance"],"readwrite").objectStore("Block_List_instance").delete(keyValue);
    request.onsuccess =  async function(event) {
      //first delete any hard DNR rules and then 
      await removeHardBlockASite(keyValue);
      //close the dialog box from here to ensure order is followed
      document.getElementById("data-Entry-dialog").close();
      displayData();
    };
  };
};

function saveDatatoDB (keyValue,remainingData) {
  //saves changes made, key value and modified data array in input
  const request = indexedDB.open("Block_List",4);
  request.onsuccess = function(event) {
    db = event.target.result;
    const objectStore = db.transaction(["Block_List_instance"],"readwrite").objectStore("Block_List_instance");
    const request = objectStore.get(keyValue);
    request.onsuccess = function(event) {
      //takes object, modifies values and puts it back
      const data = event.target.result;
      data.name = remainingData[0];
      data.hardBlock = remainingData[1];
      data.softBlock = remainingData[2];
      // when we put data we have to add the data and the keyValue or else it will create a new one
      const request = objectStore.put(data,keyValue);
      request.onsuccess = async function(event) {
        //once the value is saved have to make sure that the hard block is be done
        if (remainingData[1] === "Yes") {
          await addhardBlockASite(keyValue,1,remainingData[0]);
        } else if (remainingData[1] === "No") {
          await removeHardBlockASite(keyValue);
        };
      };
    };
  };
};


function displayData() {
  // displays all data in the IndexedDB as a table and sets button features

  // note: clearing the DOM tree doesn't help with rendering or processing issues
  // const tableDiv = document.getElementById('dynamic-table');
  // tableDiv.innerHTML = '';

  const request = indexedDB.open("Block_List",4);
  // dynamically set the table
  let tableText = "<div class = table-container> <table> <thead> <tr> <th> Website Name</th> <th>Hard Block</th> <th>Soft Block</th> <th> <button id=add-new class =button1 >Add New</button> </th></tr> </thead> <tbody> ";
  request.onsuccess = function(event) {
    db = event.target.result;
    objectStore = db.transaction("Block_List_instance").objectStore("Block_List_instance");
    //open cursor and take the all the values in instance and add table html tags
    objectStore.openCursor().onsuccess = function(event) {
      
      const cursor = event.target.result;
      if (cursor) {
        tableText = tableText +  "<tr> <td> " + cursor.value.name + "</td> <td> " + cursor.value.hardBlock + "</td> <td>" + cursor.value.softBlock + " </td> <td> <button id=modify" +  cursor.key + " class =button1 >Modify</button> </td> </tr> ";
        cursor.continue();
      }
      
      // add table to it table div
      const tableDiv = document.getElementById('dynamic-table');
      tableDiv.innerHTML = tableText + " </tbody> </table> </div>";
        
      // for each button in the table above, we run a loop and enable it to open the dialog box
      document.querySelectorAll('.button1').forEach(button => {
        button.addEventListener('click',async function() {
          // open the dialog box, pass the key id from the main page and get its corresponding values
          document.querySelector("dialog").showModal();
          // first we get the key value, enable add new or default dialog box according to value
          keyOfThisRow = Number(button.id.substring(6));
          // get all elements to be used
          const idElem = document.getElementById('key-id');
          const nameElem = document.getElementById('name-db');
          const hardBlockElem = document.getElementById('hard-block');
          const softBlockElem = document.getElementById('soft-block');

          if (isNaN(keyOfThisRow)) {
            // if no value passed through key, this is the add new mode
            // hide delete and save and show create
            document.getElementById("modal-save").classList.add("hide-button");
            document.getElementById("modal-delete").classList.add("hide-button");
            document.getElementById("modal-create").classList.remove("hide-button");

            document.getElementById("modal-create").removeEventListener

            // clear existing values in the field
            idElem.value = '';
            nameElem.value = '';
            hardBlockElem.value = '';
            softBlockElem.value = '';

            // for the add new mode, we allow user to input and create a new row and then close dialog
            // this is done by nesting in 2 functions
            document.getElementById("modal-create").addEventListener('click',addRowToDBInDialog);
          } else {
            // if value is passed through key, this is the edit mode or the default version
            // hide create and show delete and save
            document.getElementById("modal-create").classList.add("hide-button");
            document.getElementById("modal-save").classList.remove("hide-button");
            document.getElementById("modal-delete").classList.remove("hide-button");

            // for the default mode, we get the data and allow them to modify and delete it 
            idElem.value = keyOfThisRow;
            dataOnModal = await getDatafromDB(keyOfThisRow);
            nameElem.value = dataOnModal[0];
            hardBlockElem.value = dataOnModal[1];
            softBlockElem.value = dataOnModal[2];

            //button functions: delete,save
            document.getElementById("modal-delete").addEventListener('click',() => {deleteDatafromDB(keyOfThisRow);});
            document.getElementById("modal-save").addEventListener('click',() => {
              const nameValue = document.getElementById('name-db').value;
              const hardBlockValue = document.getElementById('hard-block').value;
              const softBlockValue = document.getElementById('soft-block').value;
              saveDatatoDB(keyOfThisRow,[nameValue,hardBlockValue,softBlockValue]);
            });
          };
        });
      });

      //this was where the close Event Listeners was placed initially, later moved to the toggle event listener

    };
  };
  // console.log('Testing');



};

//https://www.w3schools.com/howto/howto_css_modals.asp

// document.addEventListener('DOMContentLoaded', restoreOptions);


//https://stackoverflow.com/questions/25047402/indexeddb-return-value-after-openrequest-onsuccess
//https://www.reddit.com/r/learnjavascript/comments/kdsa25/indexeddb_retrieving_using_a_variable_outside_of/

//the thing that actually made sense for async functions
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function

//on page load displays data
window.onload = displayData;
//https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
document.getElementById('data-Entry-dialog').addEventListener('toggle', function() {
  if (document.getElementById('data-Entry-dialog').open) {
      // console.log("Toggle method vs showModal,\n also consider if I ever have to create the modal dialog in a different page");
      // I probably have to revisit this code at some point, but essentially the reason I have a toggle event listener
      // instead of putting all button functionality in the button part has to do with the fact that when the modal dialog closes
      // I need to refresh the grid and hence end up calling the displayData() function recursively, 
      // this causes an error and causes the table to lag after multiple closing and opening of the dialog box
      // not clear why this happens, but will probably have to revist this code section at some later date
      
      //closes the dialog box and refresh the grid
      document.getElementById("modal-close").addEventListener('click',() => {
        document.getElementById("data-Entry-dialog").close();
        displayData()
      });
      document.querySelector(".close").addEventListener('click',() => {
        document.getElementById("data-Entry-dialog").close();
        displayData()
      });
  };
});

//call function reference
document.getElementById('save').addEventListener('click',addDataToDB);


// document.getElementById('save2').addEventListener('click', async function(){
// () =>{ deleteDatafromDB(28);});
