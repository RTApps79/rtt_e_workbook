/**
 * organ-tumor-overlay.js
 * ----------------------------------------------------------------------
 * Reusable module that adds toggleable "tumor mass" markers to a loaded
 * Human_Body(.glb) model, plus a small on-screen panel to show/hide each
 * one individually. Shared by apps/ct_4d and 3D_LINAC so both simulators
 * present the same set of anatomical sites.
 *
 * USAGE
 * -----
 *   import { addOrganTumors, buildTumorTogglePanel } from '<path>/organ-tumor-overlay.js';
 *
 *   // Call this with the model in its natural (un-scaled, un-rotated)
 *   // local space -- i.e. right after GLTFLoader resolves, before you
 *   // call model.scale.setScalar(...) or change model.rotation.
 *   // `localBox` should be a THREE.Box3 computed from the model at that
 *   // same moment (a clone, since Box3.setFromObject mutates in place).
 *   const { group, tumors } = addOrganTumors(model, THREE, { localBox });
 *
 *   // Then, anywhere after that, build the toggle panel:
 *   buildTumorTogglePanel(tumors, { title: 'Tumor Masses' });
 *
 * WHY FRACTIONAL POSITIONS
 * -------------------------
 * Organ positions below are expressed as fractions of the model's own
 * bounding box (0 = box min, 1 = box max on each axis), NOT as fixed
 * world-unit coordinates. That way this same list works correctly no
 * matter what scale factor a given page applies to the model afterward.
 *
 * TUNING
 * ------
 * If a marker looks like it's floating outside the body, or front/back
 * or left/right seem swapped once you preview this live, this file is
 * the ONLY place you need to edit -- adjust yFrac/xFrac/zFrac below.
 * If everything is mirrored front-to-back, flip the sign of every
 * zFrac value; if left/right are swapped, flip every xFrac sign.
 */

export const ORGAN_SITES = [
  { id: 'brain',        label: 'Brain',              color: 0xff4136, yFrac: 0.955, xFrac: 0,      zFrac: 0.05,  radiusFrac: 0.025 },
  { id: 'breast_l',      label: 'Breast (L)',         color: 0xff851b, yFrac: 0.735, xFrac: -0.16,  zFrac: 0.16,  radiusFrac: 0.015 },
  { id: 'breast_r',      label: 'Breast (R)',         color: 0xff851b, yFrac: 0.735, xFrac:  0.16,  zFrac: 0.16,  radiusFrac: 0.015 },
  { id: 'lung_l',        label: 'Lung (L)',           color: 0xffdc00, yFrac: 0.715, xFrac: -0.14,  zFrac: 0.02,  radiusFrac: 0.025  },
  { id: 'lung_r',        label: 'Lung (R)',           color: 0xffdc00, yFrac: 0.715, xFrac:  0.14,  zFrac: 0.02,  radiusFrac: 0.025  },
  { id: 'pancreas',      label: 'Pancreas',           color: 0x2ecc40, yFrac: 0.585, xFrac: -0.04,  zFrac: -0.03, radiusFrac: 0.035 },
  { id: 'colon',         label: 'Colon',              color: 0x01ff70, yFrac: 0.48,  xFrac:  0.10,  zFrac: 0.05,  radiusFrac: 0.004  },
  { id: 'prostate',      label: 'Prostate',           color: 0x0074d9, yFrac: 0.415, xFrac: 0,      zFrac: -0.2, radiusFrac: 0.013  },
  { id: 'endometrium',   label: 'Endometrium',        color: 0xb10dc9, yFrac: 0.415, xFrac: 0,      zFrac: 0.03,  radiusFrac: 0.003  },
  { id: 'spine_c',       label: 'Spine (Cervical)',   color: 0x7fdbff, yFrac: 0.90,  xFrac: 0,      zFrac: -0.09, radiusFrac: 0.0003 },
  { id: 'spine_t',       label: 'Spine (Thoracic)',   color: 0x7fdbff, yFrac: 0.70,  xFrac: 0,      zFrac: -0.10, radiusFrac: 0.0003  },
  { id: 'spine_l',       label: 'Spine (Lumbar)',     color: 0x7fdbff, yFrac: 0.48,  xFrac: 0,      zFrac: -0.09, radiusFrac: 0.0003  },
  { id: 'femur_l',       label: 'Femur (L)',          color: 0xdddddd, yFrac: 0.26,  xFrac: -0.09,  zFrac: 0,     radiusFrac: 0.0035 },
  { id: 'femur_r',       label: 'Femur (R)',          color: 0xdddddd, yFrac: 0.26,  xFrac:  0.09,  zFrac: 0,     radiusFrac: 0.0035 },
];

/**
 * Adds one sphere mesh per organ site as children of `model`, grouped
 * under a single THREE.Group named "OrganTumorMasses" for easy cleanup.
 *
 * @param {THREE.Object3D} model - the loaded body model (gltf.scene)
 * @param {typeof import('three')} THREE - the THREE namespace in use
 * @param {Object} [opts]
 * @param {THREE.Box3} [opts.localBox] - pre-computed local bbox of model
 *        (recommended). If omitted, computed fresh from `model` as-is.
 * @param {number} [opts.emissiveIntensity=0.6]
 * @returns {{ group: THREE.Group, tumors: Array<{id:string,label:string,mesh:THREE.Mesh}> }}
 */
export function addOrganTumors(model, THREE, opts = {}) {
  const emissiveIntensity = opts.emissiveIntensity ?? 0.6;
  const box = opts.localBox ? opts.localBox.clone() : new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const min = box.min;
  const maxDim = Math.max(size.x, size.y, size.z);

  const group = new THREE.Group();
  group.name = 'OrganTumorMasses';

  const tumors = ORGAN_SITES.map((site) => {
    const radius = Math.max(maxDim * site.radiusFrac, 0.001);
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: site.color,
      emissive: site.color,
      emissiveIntensity,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `tumor_${site.id}`;
    mesh.castShadow = true;
    mesh.position.set(
      min.x + size.x * (0.5 + site.xFrac),
      min.y + size.y * site.yFrac,
      min.z + size.z * (0.5 + site.zFrac)
    );
    mesh.userData.organSite = site;
    group.add(mesh);
    return { id: site.id, label: site.label, mesh };
  });

  model.add(group);
  return { group, tumors };
}

let stylesInjected = false;
function injectStylesOnce() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .organ-tumor-panel {
      position: fixed;
      top: 90px;
      right: 12px;
      z-index: 999;
      background: rgba(20, 20, 25, 0.88);
      color: #f0f0f0;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      border-radius: 8px;
      padding: 10px 12px;
      max-height: 70vh;
      overflow-y: auto;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      min-width: 170px;
    }
    .organ-tumor-panel__title {
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 13px;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      padding-bottom: 4px;
    }
    .organ-tumor-panel__row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;
      cursor: pointer;
    }
    .organ-tumor-panel__buttons {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .organ-tumor-panel__buttons button {
      flex: 1;
      font-size: 11px;
      padding: 4px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.08);
      color: #f0f0f0;
      cursor: pointer;
    }
    .organ-tumor-panel__buttons button:hover {
      background: rgba(255,255,255,0.18);
    }
    .organ-tumor-panel__toggle {
      position: fixed;
      top: 90px;
      right: 12px;
      z-index: 1000;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(20,20,25,0.88);
      color: #f0f0f0;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Builds a fixed-position panel with one checkbox per tumor plus
 * Show All / Hide All buttons. Appends to `container` if given,
 * otherwise to document.body.
 *
 * @param {Array<{id:string,label:string,mesh:THREE.Mesh}>} tumors
 * @param {HTMLElement} [container]
 * @param {Object} [opts]
 * @param {string} [opts.title='Tumor Masses']
 * @param {boolean} [opts.startVisible=true]
 * @returns {HTMLElement} the panel element
 */
export function buildTumorTogglePanel(tumors, container, opts = {}) {
  injectStylesOnce();
  const title = opts.title || 'Tumor Masses';
  const startVisible = opts.startVisible !== false;

  tumors.forEach(({ mesh }) => { mesh.visible = startVisible; });

  const panel = document.createElement('div');
  panel.className = 'organ-tumor-panel';

  const titleEl = document.createElement('div');
  titleEl.className = 'organ-tumor-panel__title';
  titleEl.textContent = title;
  panel.appendChild(titleEl);

  const list = document.createElement('div');
  list.className = 'organ-tumor-panel__list';
  tumors.forEach(({ id, label, mesh }) => {
    const row = document.createElement('label');
    row.className = 'organ-tumor-panel__row';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = startVisible;
    checkbox.dataset.tumorId = id;
    checkbox.addEventListener('change', (e) => {
      mesh.visible = e.target.checked;
    });
    const span = document.createElement('span');
    span.textContent = label;
    row.appendChild(checkbox);
    row.appendChild(span);
    list.appendChild(row);
  });
  panel.appendChild(list);

  const btnRow = document.createElement('div');
  btnRow.className = 'organ-tumor-panel__buttons';

  const showAllBtn = document.createElement('button');
  showAllBtn.type = 'button';
  showAllBtn.textContent = 'Show All';
  showAllBtn.addEventListener('click', () => {
    tumors.forEach(({ mesh }) => { mesh.visible = true; });
    list.querySelectorAll('input[type="checkbox"]').forEach((i) => { i.checked = true; });
  });

  const hideAllBtn = document.createElement('button');
  hideAllBtn.type = 'button';
  hideAllBtn.textContent = 'Hide All';
  hideAllBtn.addEventListener('click', () => {
    tumors.forEach(({ mesh }) => { mesh.visible = false; });
    list.querySelectorAll('input[type="checkbox"]').forEach((i) => { i.checked = false; });
  });

  btnRow.appendChild(showAllBtn);
  btnRow.appendChild(hideAllBtn);
  panel.appendChild(btnRow);

  // Collapsible: clicking the title toggles the list/buttons.
  let collapsed = false;
  const collapseToggle = document.createElement('button');
  collapseToggle.className = 'organ-tumor-panel__toggle';
  collapseToggle.type = 'button';
  collapseToggle.textContent = 'Hide panel';
  collapseToggle.addEventListener('click', () => {
    collapsed = !collapsed;
    panel.style.display = collapsed ? 'none' : 'block';
    collapseToggle.style.display = collapsed ? 'block' : 'none';
    collapseToggle.textContent = 'Show panel';
  });

  const target = container || document.body;
  target.appendChild(panel);
  target.appendChild(collapseToggle);
  collapseToggle.style.display = 'none';

  return panel;
}
