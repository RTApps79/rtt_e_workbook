const linacComponents = [
  {
    name: "Gantry",
    svg: `<svg width="320" height="120" viewBox="0 0 320 120">
      <ellipse cx="70" cy="60" rx="40" ry="45" fill="#ffe082" stroke="#1976d2" stroke-width="2"/>
      <rect x="108" y="44" width="32" height="32" fill="#f1c232" stroke="#bfa200" stroke-width="1.5"/>
      <rect x="140" y="55" width="36" height="10" fill="#b0b0b0" stroke="#888" stroke-width="0.8"/>
      <rect x="176" y="50" width="18" height="22" fill="#b7e2ee" stroke="#1976d2" stroke-width="1"/>
      <rect x="212" y="76" width="90" height="17" fill="#b6e0fe" stroke="#1976d2" stroke-width="1.5"/>
      <text x="70" y="30" text-anchor="middle" fill="#1976d2" font-size="12">?</text>
    </svg>`
  },
  {
    name: "Collimator",
    svg: `<svg width="320" height="120" viewBox="0 0 320 120">
      <ellipse cx="70" cy="60" rx="40" ry="45" fill="#e5edfa" stroke="#1976d2" stroke-width="2"/>
      <rect x="108" y="44" width="32" height="32" fill="#ffe082" stroke="#bfa200" stroke-width="2.5"/>
      <rect x="140" y="55" width="36" height="10" fill="#b0b0b0" stroke="#888" stroke-width="0.8"/>
      <rect x="176" y="50" width="18" height="22" fill="#b7e2ee" stroke="#1976d2" stroke-width="1"/>
      <rect x="212" y="76" width="90" height="17" fill="#b6e0fe" stroke="#1976d2" stroke-width="1.5"/>
      <text x="124" y="40" text-anchor="middle" fill="#1976d2" font-size="12">?</text>
    </svg>`
  },
  {
    name: "MLC",
    svg: `<svg width="320" height="120" viewBox="0 0 320 120">
      <ellipse cx="70" cy="60" rx="40" ry="45" fill="#e5edfa" stroke="#1976d2" stroke-width="2"/>
      <rect x="108" y="44" width="32" height="32" fill="#f1c232" stroke="#bfa200" stroke-width="1.5"/>
      <rect x="140" y="55" width="36" height="10" fill="#ffe082" stroke="#fbc02d" stroke-width="2.5"/>
      <rect x="176" y="50" width="18" height="22" fill="#b7e2ee" stroke="#1976d2" stroke-width="1"/>
      <rect x="212" y="76" width="90" height="17" fill="#b6e0fe" stroke="#1976d2" stroke-width="1.5"/>
      <text x="158" y="50" text-anchor="middle" fill="#1976d2" font-size="12">?</text>
    </svg>`
  },
  {
    name: "Tray",
    svg: `<svg width="320" height="120" viewBox="0 0 320 120">
      <ellipse cx="70" cy="60" rx="40" ry="45" fill="#e5edfa" stroke="#1976d2" stroke-width="2"/>
      <rect x="108" y="44" width="32" height="32" fill="#f1c232" stroke="#bfa200" stroke-width="1.5"/>
      <rect x="140" y="55" width="36" height="10" fill="#b0b0b0" stroke="#888" stroke-width="0.8"/>
      <rect x="176" y="50" width="18" height="22" fill="#ffe082" stroke="#1976d2" stroke-width="2.5"/>
      <rect x="212" y="76" width="90" height="17" fill="#b6e0fe" stroke="#1976d2" stroke-width="1.5"/>
      <text x="185" y="45" text-anchor="middle" fill="#1976d2" font-size="12">?</text>
    </svg>`
  },
  {
    name: "Couch",
    svg: `<svg width="320" height="120" viewBox="0 0 320 120">
      <ellipse cx="70" cy="60" rx="40" ry="45" fill="#e5edfa" stroke="#1976d2" stroke-width="2"/>
      <rect x="108" y="44" width="32" height="32" fill="#f1c232" stroke="#bfa200" stroke-width="1.5"/>
      <rect x="140" y="55" width="36" height="10" fill="#b0b0b0" stroke="#888" stroke-width="0.8"/>
      <rect x="176" y="50" width="18" height="22" fill="#b7e2ee" stroke="#1976d2" stroke-width="1"/>
      <rect x="212" y="76" width="90" height="17" fill="#ffe082" stroke="#1976d2" stroke-width="2.5"/>
      <text x="255" y="100" text-anchor="middle" fill="#1976d2" font-size="12">?</text>
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
