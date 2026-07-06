import { AlignmentCase, Patient } from './types';

export const ENERGY_OPTIONS = [
  '6 MV', '10 MV', '15 MV', '18 MV', 
  '6 MeV', '9 MeV', '12 MeV', '15 MeV', '18 MeV'
];

export const CONE_SIZES = [
  { label: '6x6 cm', size: 6 },
  { label: '10x10 cm', size: 10 },
  { label: '15x15 cm', size: 15 },
  { label: '20x20 cm', size: 20 },
  { label: '25x25 cm', size: 25 },
];

export const STATIC_MLC_IMAGE = "https://static.cambridge.org/binary/version/id/urn:cambridge.org:id:binary:20201118073725962-0555:S1460396919000815:S1460396919000815_fig1.png?pub-status=live";
export const ANIMATED_MLC_IMAGE = "https://help.imageowl.com/hc/article_attachments/15980435011475";

// Using placeholder fallbacks for the extensive list where specific raw assets might not exist, 
// but mapping the provided URLs where applicable.
const ASSET_BASE = "https://raw.githubusercontent.com/RTApps79/rtt_e_workbook/main/assets";

export const ALIGNMENT_CASES: AlignmentCase[] = [
  {
    id: 'case_gbm',
    name: 'Brain: Glioblastoma (GBM)',
    baseImage: "https://cdnintech.com/media/chapter/43882/1512345123/media/image8.jpeg", // Representative DRR
    overlayImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUUUdHhYMNRzUvgzH5nCfsCNG3AU-RdcFHUwSxFFeEr1cns2zk7-vEGwrf1V2riL1Gl48&usqp=CAU", // Representative Port
    description: "Align skull anatomy. Tolerance: 2mm.",
    targetShift: { x: 2, y: -1 }
  },
  {
    id: 'case_brain_mets',
    name: 'Brain: Multiple Mets (WBRT)',
    baseImage: "https://media.springernature.com/full/springer-static/image/art%3A10.1186%2F1748-717X-7-54/MediaObjects/13014_2011_Article_566_Fig2_HTML.jpg?as=webp",
    overlayImage: "https://assets.medlink.com/content/article-media/srjh4-1.jpg",
    description: "Align C1/C2 and orbital rims. Tolerance: 3mm.",
    targetShift: { x: 0, y: 2 }
  },
  {
    id: 'case_hn_tonsil',
    name: 'H&N: SCCa Left Tonsil',
    baseImage: "https://www.researchgate.net/profile/Hilke-Vorwerk/publication/51583639/figure/fig1/AS:202931841310725@1425394129420/Anatomic-head-and-neck-regions-contoured-on-a-sagittal-DRR-and-transversal-CT-slices.png",
    overlayImage: `${ASSET_BASE}/h_n_port.JPG`,
    description: "Align C-spine and mandible. Tolerance: 2mm.",
    targetShift: { x: 3, y: 3 }
  },
  {
    id: 'case_lung_nsclc',
    name: 'Thorax: NSCLC Stage IIIA',
    baseImage: "https://ars.els-cdn.com/content/image/1-s2.0-S1556086415304597-gr1.jpg",
    overlayImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgzWvb2pns6hkrZZenJGznkKhsySMWeq7aL4JIcgiDQbkhU0aDzggm3y_Aj7UhFTKzYIY&usqp=CAU",
    description: "Align carina and spine. Tolerance: 5mm.",
    targetShift: { x: -4, y: 2 }
  },
  {
    id: 'case_breast_left',
    name: 'Breast: Left IDC',
    baseImage: "https://ars.els-cdn.com/content/image/1-s2.0-S0360301609008554-gr1.jpg",
    overlayImage: "https://radiologykey.com/wp-content/uploads/2017/06/A321063_1_En_993_Fig1_HTML.jpg",
    description: "Align chest wall and lung interface. Tolerance: 5mm.",
    targetShift: { x: 1, y: -2 }
  },
  {
    id: 'case_pancreas',
    name: 'Abdomen: Pancreas',
    baseImage: "https://www.redjournal.org/cms/asset/2d53d2ec-8bd0-43e6-b10a-b405e7f96e69/gr2.jpg",
    overlayImage: "https://prod-images-static.radiopaedia.org/images/52301687/8936a8618145d822e87f8c906f3cff_gallery.jpeg",
    description: "Align vertebral bodies and diaphragm. Tolerance: 3mm.",
    targetShift: { x: 0, y: 0 }
  },
  {
    id: 'case_prostate',
    name: 'Pelvis: High Risk Prostate',
    baseImage: "https://journals.viamedica.pl/oncology_in_clinical_practice/article/viewFile/41762/36028/107423",
    overlayImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSFdCUqOQrwvUiBu_M9dwayLzHtK6jVRd058ABqL-x1LDp-E5onG8BBndOU4B22N5WoFM&usqp=CAU",
    description: "Align fiducials and pelvic rim. Tolerance: 3mm.",
    targetShift: { x: -2, y: -1 }
  },
  {
    id: 'case_spine_mets',
    name: 'Spine: L3 Metastasis',
    baseImage: "https://radiologykey.com/wp-content/uploads/2021/04/f15-06-9780323761116.jpg",
    overlayImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReGewyWzfv_ED4U2f7rGxYLsg6bmkqOpgb8nkVCgZNpJSPuRaa5Bz84L0UDa3vkL2HT8U&usqp=CAU",
    description: "Align vertebral body L3. Tolerance: 2mm.",
    targetShift: { x: 0, y: 4 }
  }
];

export const PATIENT_WORKLIST: Patient[] = [
  {
    id: 'MRN-1001', name: 'Smith, John', dob: '03/12/1955',
    diagnosis: 'Glioblastoma (GBM)', plan: 'VMAT Brain 60Gy', chemo: 'Temodar',
    alignmentCaseId: 'case_gbm',
    setup: { energy: '6 MV', gantry: 0, collimator: 0, couch: 0, mu: 200, jaws: { x1: 5, x2: 5, y1: 5, y2: 5 } },
    labs: { creatinine: '0.9', wbc: '5.2' }
  },
  {
    id: 'MRN-1002', name: 'Garcia, Maria', dob: '07/22/1960',
    diagnosis: 'Brain Mets (NSCLC)', plan: 'WBRT 30Gy/10fx', chemo: 'None',
    alignmentCaseId: 'case_brain_mets',
    setup: { energy: '6 MV', gantry: 90, collimator: 90, couch: 0, mu: 300, jaws: { x1: 10, x2: 10, y1: 8, y2: 8 } },
    labs: { creatinine: '0.8', wbc: '4.1' }
  },
  {
    id: 'MRN-1003', name: 'Chen, Sarah', dob: '09/15/1968',
    diagnosis: 'SCCa Left Tonsil', plan: 'IMRT H&N 70Gy', chemo: 'Cisplatin',
    alignmentCaseId: 'case_hn_tonsil',
    setup: { energy: '6 MV', gantry: 270, collimator: 15, couch: 0, mu: 450, jaws: { x1: 7, x2: 7, y1: 9, y2: 9 } },
    labs: { creatinine: '1.1', wbc: '3.8' }
  },
  {
    id: 'MRN-1004', name: 'Jones, Linda', dob: '11/02/1952',
    diagnosis: 'NSCLC Stage IIIA', plan: 'VMAT Lung 60Gy', chemo: 'Carbo/Taxol',
    alignmentCaseId: 'case_lung_nsclc',
    setup: { energy: '6 MV', gantry: 180, collimator: 5, couch: 0, mu: 280, jaws: { x1: 8, x2: 8, y1: 12, y2: 12 } },
    labs: { creatinine: '0.7', wbc: '6.5' }
  },
  {
    id: 'MRN-1006', name: 'Peterson, Mary', dob: '05/14/1970',
    diagnosis: 'Breast IDC Left', plan: 'Tangents 42.5Gy', chemo: 'None',
    alignmentCaseId: 'case_breast_left',
    setup: { energy: '6 MV', gantry: 55, collimator: 10, couch: 0, mu: 180, jaws: { x1: 0, x2: 8, y1: 10, y2: 10 } },
    labs: { creatinine: '0.8', wbc: '5.9' }
  },
  {
    id: 'MRN-1009', name: 'Garcia, David', dob: '01/30/1965',
    diagnosis: 'Pancreatic Cancer', plan: 'VMAT Pancreas', chemo: 'Gemcitabine',
    alignmentCaseId: 'case_pancreas',
    setup: { energy: '15 MV', gantry: 0, collimator: 0, couch: 0, mu: 350, jaws: { x1: 6, x2: 6, y1: 6, y2: 6 } },
    labs: { creatinine: '1.0', wbc: '4.2' }
  },
  {
    id: 'MRN-1010', name: 'Wilson, James', dob: '08/19/1950',
    diagnosis: 'Prostate Cancer', plan: 'VMAT Prostate 78Gy', chemo: 'Lupron',
    alignmentCaseId: 'case_prostate',
    setup: { energy: '10 MV', gantry: 180, collimator: 0, couch: 0, mu: 500, jaws: { x1: 5, x2: 5, y1: 5, y2: 5 } },
    labs: { creatinine: '1.2', wbc: '7.1' }
  },
  {
    id: 'MRN-1014', name: 'Harris, George', dob: '12/05/1948',
    diagnosis: 'Mets to L3 Spine', plan: 'Palliative Spine', chemo: 'None',
    alignmentCaseId: 'case_spine_mets',
    setup: { energy: '6 MV', gantry: 180, collimator: 0, couch: 0, mu: 300, jaws: { x1: 4, x2: 4, y1: 8, y2: 8 } },
    labs: { creatinine: '1.3', wbc: '5.5' }
  }
];

export const DEMO_PATIENT = PATIENT_WORKLIST[0];