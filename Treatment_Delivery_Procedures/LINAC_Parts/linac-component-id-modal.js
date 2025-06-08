const linacComponents = [
  {
    name: "Gantry",
    svg: `<svg width="300" height="220" viewBox="0 0 300 220">
      <rect x="20" y="40" width="70" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/> <rect x="90" y="180" width="120" height="20" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/> <rect x="125" y="200" width="50" height="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/> <path d="M 90 40 L 230 40 L 230 80 L 190 80 L 190 120 L 230 120 L 230 160 L 90 160 Z" fill="#ffe082" stroke="#bfa200" stroke-width="2.5"/>
      <text x="160" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#1976d2" font-weight="bold">?</text>
    </svg>`
  },
  {
    name: "Collimator", // Representing secondary collimator jaws within the head
    svg: `<svg width="300" height="220" viewBox="0 0 300 220">
      <rect x="20" y="40" width="70" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/> <path d="M 90 40 L 230 40 L 230 80 L 190 80 L 190 120 L 230 120 L 230 160 L 90 160 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/> <rect x="90" y="180" width="120" height="20" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/> <rect x="125" y="200" width="50" height="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/> <rect x="185" y="85" width="50" height="30" fill="#ffe082" stroke="#bfa200" stroke-width="2.5" rx="2"/>
      <text x="210" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#1976d2" font-weight="bold">?</text>
    </svg>`
  },
  {
    name: "MLC", // Representing MLCs within the head, conceptually
    svg: `<svg width="300" height="220" viewBox="0 0 300 220">
      <rect x="20" y="40" width="70" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <path d="M 90 40 L 230 40 L 230 80 L 190 80 L 190 120 L 230 120 L 230 160 L 90 160 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <rect x="90" y="180" width="120" height="20" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <rect x="125" y="200" width="50" height="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
      <rect x="190" y="110" width="40" height="15" fill="#ffe082" stroke="#bfa200" stroke-width="2.5" rx="2"/>
      <text x="210" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#1976d2" font-weight="bold">?</text>
    </svg>`
  },
  {
    name: "Tray", // Representing Accessory Tray/Mount area
    svg: `<svg width="300" height="220" viewBox="0 0 300 220">
      <rect x="20" y="40" width="70" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <path d="M 90 40 L 230 40 L 230 80 L 190 80 L 190 120 L 230 120 L 230 160 L 90 160 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <rect x="90" y="180" width="120" height="20" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <rect x="125" y="200" width="50" height="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
      <rect x="180" y="130" width="60" height="10" fill="#ffe082" stroke="#bfa200" stroke-width="2.5" rx="1"/>
      <text x="210" y="138" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#1976d2" font-weight="bold">?</text>
    </svg>`
  },
  {
    name: "Couch",
    svg: `<svg width="300" height="220" viewBox="0 0 300 220">
      <rect x="20" y="40" width="70" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <path d="M 90 40 L 230 40 L 230 80 L 190 80 L 190 120 L 230 120 L 230 160 L 90 160 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
      <rect x="90" y="180" width="120" height="20" fill="#ffe082" stroke="#bfa200" stroke-width="2.5"/> <rect x="125" y="200" width="50" height="20" fill="#f1c232" stroke="#bfa200" stroke-width="1.5"/> <text x="150" y="195" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#1976d2" font-weight="bold">?</text>
    </svg>`
  }
];
let currentLinacCompIdx = 0;
function nextLinacComponentID() {
  currentLinacCompIdx = Math.floor(Math.random()*linacComponents.length);
  document.getElementById('linac-component-img-area').innerHTML = linacComponents[currentLinacCompIdx].svg;
  document.getElementById('linac-component-form').reset();
  document.getElementById('linac-component-id-feedback').textContent = '';
}
function checkLinacComponentID() {
  const radios = document.getElementsByName('comp');
  let selected = "";
  for (let r of radios) if (r.checked) selected = r.value;
  if (!selected) {
    document.getElementById('linac-component-id-feedback').innerHTML = '<span class="fail">Please select an answer.</span>';
    return;
  }
  let correct = linacComponents[currentLinacCompIdx].name;
  // Accept "MLC" and "MLC Leaves" as correct for MLC
  let match = (selected === correct) || (selected === "MLC" && correct === "MLC");
  if (match) {
    document.getElementById('linac-component-id-feedback').innerHTML = '<span class="pass">&#10003; Correct!</span>';
  } else {
    document.getElementById('linac-component-id-feedback').innerHTML = `<span class="fail">&#10008; Incorrect.</span> Correct: <b>${correct}</b>`;
  }
}
function openLinacComponentIDModal() {
  nextLinacComponentID();
  document.getElementById('linac-component-id-bg').style.display = 'flex';
}
function closeLinacComponentIDModal() {
  document.getElementById('linac-component-id-bg').style.display = 'none';
}
document.getElementById('close-linac-component-id').onclick = closeLinacComponentIDModal;
document.getElementById('linac-component-id-bg').onclick = function(e) {
  if(e.target===this) closeLinacComponentIDModal();
};
window.openLinacComponentIDModal = openLinacComponentIDModal;
