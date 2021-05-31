let db;
let dbVersion;

const request = window.indexedDB.open("BudgetDB", dbVersion || 1);

//creating an object store and setting auto increment to allow for future files/information to be stored within
request.onupgradeneeded = function (e) {
  console.log("offline - indexDB");
  db = e.target.result;
  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

//checking to see if the DB is back online before calling checkDatabase function
request.onsuccess = function (e) {
  db = e.target.result;
  if (navigator.onLine) {
    console.log("Database back online! 🗄️");
    checkDatabase();
  }
};

//error handling
request.onerror = function (e) {
  console.log(`Bummer! ${e.target.errorCode}`);
};

//creating a transaction and saaving within the offline indexDB
const saveRecord = (record) => {
  console.log("Saving record(s)");
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");
  store.add(record);
};

//checkDatabase function is looking for previously stored entries and if entries exist sending them to the DB via API
function checkDatabase() {
  console.log("checking db");
  let transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");
  const getAll = store.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");
            const currentStore = transaction.objectStore("BudgetStore");
            currentStore.clear();
            console.log("Clearing stored things 🧹");
          }
        });
    }
  };
}

//listneng for application to come back online and then calling checkDatabase if online
window.addEventListener("online", checkDatabase);
