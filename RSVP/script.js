 //GLOBAL STATE
let guest = "";
let page = 1;

//INITIAL SCREEN
showNameInput();

function showNameInput() {

document.getElementById("screen").innerHTML = `
  <h2>Find your name:</h2>
  <input id="guest">
  <button onclick="searchName()">Find</button>
`;

}
//SEARCH FUNCTION
async function searchName() {

const guestInput = document.getElementById("guest").value.trim();

let response =
await fetch(
"https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec?guest="
+ encodeURIComponent(guestInput)
);

let matches =
await response.json();

let html=
`<h2>Select your name</h2>`;

if (!matches || matches.length === 0) {
  document.getElementById("screen").innerHTML = `
    <h2>Name is not in the invite list</h2>
    <button onclick="showNameInput()">Try again</button>
  `;
  return;
}

matches.forEach(m => {

html += `
<label>
  <input
    type="radio"
    name="guest"
    value="${m.name}"
    data-seats="${m.seats || ''}"
    data-companions="${m.companions || ''}"
  >
  ${m.name}
</label>
<br>
`;

});

html+=`

<button onclick="confirmName()">
Continue
</button>

`;

document.getElementById(
"screen"
).innerHTML=html;

}
//RENDER RESULTS
function renderResults(data) {

let html = `<h2>Select your name</h2>`;

data.results.forEach(m => {

html += `
  <label>
    <input
      type="radio"
      name="guest"
      value="${m.name}"
      data-seats="${m.seats}"
      data-companions="${m.companions}"
    >
    ${m.name}
  </label><br>
`;

});

html += `
<br>
<button onclick="confirmName()">Continue</button>
<br><br>
`;

if ((page * 10) < data.total) {
  html += `<button onclick="nextPage()">Next</button>`;
}

if (page > 1) {
  html += `<button onclick="prevPage()">Previous</button>`;
}

document.getElementById("screen").innerHTML = html;

}

//CONFIRM NAME (SAFE VERSION)
function confirmName() {

  let radio = document.querySelector('input[name="guest"]:checked');

  if (!radio) {
    alert("Please select your name");
    return;
  }

  let selected = {
    name: radio.value,
    seats: radio.getAttribute("data-seats"),
    companions: radio.getAttribute("data-companions")
  };

  window.currentGuest = selected;

  let companions = (selected.companions || "").split(",");

  let html = `
    Seats: ${selected.seats}
    <br><br>
    Companions:
  `;

  companions.forEach(c => {
    html += `<li>${c}</li>`;
  });

  html += `
    <br><br>
    Please confirm if the guest names are correct

    <button onclick="attendanceYes()">Confirming</button>
    <button onclick="attendanceNo()">I want to edit</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

async function attendanceYes() {

  try {

    let guest = window.currentGuest;

    if (!guest) {
      alert("No guest selected");
      return;
    }

    let res = await fetch(
      "https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec",
      {
        method: "POST",
        body: JSON.stringify({
          name: guest.name,
          seats: guest.seats,
          companions: guest.companions,
          status: "PENDING"
        })
      }
    );

    let text = await res.text();
    text = text.trim();

    console.log("RESPONSE:", text);

    if (
      text === "UPDATED" ||
      text === "SAVED" ||
      text === ""
    ) {

      showAttendanceQuestion();

    } else {

      alert("Save failed: " + text);

    }

  } catch (err) {

    console.error(err);
    alert("Error: " + err.message);

  }
}

function attendanceNo() {

  const maxSeats = parseInt(window.currentGuest.seats || 1);
  const maxCompanions = Math.max(maxSeats - 1, 0);

  document.getElementById("screen").innerHTML = `
    <h2>Edit Your RSVP</h2>

    <p><b>Main Guest:</b> ${window.currentGuest.name} </p>

    <p><b>Max Seats:</b> ${maxSeats}</p>

    <p><b>Allowed Companions:</b> ${maxCompanions}</p>

    <h3>Enter Companion Names:</h3>

    <input id="companionList" placeholder="Separate names with a comma">

    <br><br>

    <button onclick="generateGuests()">
      Next
    </button>
  `;
}


function finalStep() {
  document.getElementById("screen").innerHTML = `
    <h2>Thank you for confirming!</h2>
  `;
}


//GENERATE INPUTS
function generateGuests() {

  const maxSeats = parseInt(window.currentGuest.seats || 1);
  const maxCompanions = Math.max(maxSeats - 1, 0);

  const input =
    document.getElementById("companionList").value || "";

  let companions =
    input
      .split(",")
      .map(x => x.trim())
      .filter(x => x.length > 0);

  // LIMIT CHECK
  if (companions.length > maxCompanions) {
    alert(`You can only add up to ${maxCompanions} companion(s).`);
    return;
  }

  window.tempRSVP = {
  companions: companions
  };

  let html = `
    <h2>Confirm Updated List</h2>

    <p><b>Seats:</b> ${maxSeats}</p>

    <ul>
      <li><b>${window.currentGuest.name}</b> (Main Guest)</li>
  `;

  companions.forEach(c => {
    html += `<li>${c}</li>`;
  });

  html += `
    </ul>

    <p>Is this correct?</p>

    <button onclick="confirmAttendanceChoice()">Yes</button>
    <button onclick="attendanceNo()">No</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

function reviewGuestList(count) {

  let guests = [];

  for (let i = 1; i <= count; i++) {
    let name = document.getElementById("g" + i).value;
    if (name) guests.push(name);
  }

  window.tempRSVP.guests = guests;

  let html = `
    <h2>Confirm Updated List</h2>
    <p><b>Seats:</b> ${guests.length}</p>
    <p><b>Guests:</b></p>
    <ul>
  `;

  guests.forEach(g => {
    html += `<li>${g}</li>`;
  });

  html += `
    </ul>

    <p>Is this correct?</p>

    <button onclick="confirmAttendanceChoice()">Yes</button>
    <button onclick="attendanceNo()">No, Edit Again</button>
  `;

  document.getElementById("screen").innerHTML = html;
}

function confirmAttendanceChoice() {
  saveGuestList();
}
 async function saveGuestList() {
  try {

    let guest = window.currentGuest;

    if (!guest || !window.tempRSVP) {
      alert("Missing data");
      return;
    }

    let res = await fetch(
      "https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec",
      {
        method: "POST",
        body: JSON.stringify({
          name: guest.name,
          seats: window.tempRSVP.companions.length + 1,
          companions: window.tempRSVP.companions.join(", "),
          status: "UPDATED"
        })
      }
    );

    let text = (await res.text()).trim();
    console.log("SAVE RESPONSE:", text);

    if (text === "UPDATED" || text === "SAVED" || text === "") {

      // 🔥 update state so UI doesn't revert
      window.currentGuest = {
        ...window.currentGuest,
        seats: window.tempRSVP.companions.length + 1,
        companions: window.tempRSVP.companions.join(", ")
      };

      showAttendanceQuestion();

    } else {
      alert("Save failed: " + text);
    }

  } catch (err) {
    console.error(err);
    alert("Unable to save guest list.");
  }
}


function showAttendanceQuestion() {

  document.getElementById("screen").innerHTML = `
    <h2>Final Guest List</h2>

    <p><b>Main Guest:</b> ${window.currentGuest.name}</p>

    <p><b>Companions:</b> ${window.currentGuest.companions}</p>

    <p><b>Total Seats:</b> ${window.currentGuest.seats}</p>

    <hr>

    <h2>Will you attend Anaiah's 1st Birthday?</h2>

    <button onclick="finalAttendance('YES')">
      Yes, We Will Attend
    </button>

    <button onclick="finalAttendance('NO')">
      Sorry, We Can't Make It
    </button>
  `;
}


async function finalAttendance(answer) {

  try {

    let guest = window.currentGuest;

    let res = await fetch(
      "https://script.google.com/macros/s/AKfycbyIvNFICoN16ta_nxYkCfiWsBHuzZgd8v9emDRmp88TqQXadM9d0_ZpZIQRmzkof6dKMQ/exec",
      {
        method: "POST",
        body: JSON.stringify({
          name: guest.name,
          seats: guest.seats,
          companions: guest.companions,
          status: answer
        })
      }
    );

    await res.text();

    if (answer === "YES") {

      document.getElementById("screen").innerHTML = `
        <h2>🎉 Thank you!</h2>
        <p>Your RSVP has been confirmed.</p>
        <p>We can't wait to celebrate Anaiah's 1st Birthday with you! 🥳</p>
      `;

    } else {

      document.getElementById("screen").innerHTML = `
        <h2>💛 Thank you for letting us know!</h2>
        <p>Your RSVP has been updated.</p>
        <p>We'll miss you and hope to see you next time.</p>
      `;

    }

  } catch (err) {

    console.error(err);
    alert("Unable to save attendance.");

  }
}     