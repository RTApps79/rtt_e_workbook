
import { Question, QuestionTemplate } from '../types';
import { shuffleArray, getRandomInt, getRandomFloat } from '../utils/helpers';

export const questionTemplates: QuestionTemplate[] = [
    {
        cat: 'Gap Calculation',
        generate: () => {
            const L1 = getRandomInt(18, 32);
            const L2 = getRandomInt(18, 32);
            const depth = getRandomInt(5, 8);
            const ssd = 100;

            const answer = (L1 / 2 * depth / ssd) + (L2 / 2 * depth / ssd);
            const options = [
                `${answer.toFixed(1)} cm`,
                `${(answer * 1.5).toFixed(1)} cm`,
                `${(answer * 0.7).toFixed(1)} cm`,
                `${(answer + 2).toFixed(1)} cm`
            ];

            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${answer.toFixed(1)} cm`);
            
            return {
                cat: 'Gap Calculation',
                scenario: `Two spinal fields abut at a depth of ${depth} cm. Calculate "X" (The Skin Gap).`,
                data: {
                    "Field 1 Length (L1)": `${L1} cm`,
                    "Field 1 Width": `${getRandomInt(8, 12)} cm`,
                    "Field 2 Length (L2)": `${L2} cm`,
                    "Field 2 Width": `${getRandomInt(8, 12)} cm`,
                    "Match Depth (d)": `${depth} cm`,
                    "SSD": `${ssd} cm`
                },
                hint: `Gap = (L1/2 × d/SSD) + (L2/2 × d/SSD)`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Use Field LENGTHS, ignore Widths.</strong><br>The calculation is based on similar triangles formed by the diverging beam edges.`,
                math: `Gap = (${L1}/2 × ${depth}/${ssd}) + (${L2}/2 × ${depth}/${ssd})\nGap = (${(L1/2).toFixed(1)} × ${(depth/ssd).toFixed(2)}) + (${(L2/2).toFixed(1)} × ${(depth/ssd).toFixed(2)})\nGap = ${(L1/2 * depth/ssd).toFixed(2)} + ${(L2/2 * depth/ssd).toFixed(2)}\nGap = ${answer.toFixed(2)} cm`,
                diagram: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg"><style>.txt{font-family:monospace;font-size:12px;fill:white;}.dash{stroke-dasharray:2,2;}.blue{fill:rgba(0,150,255,0.6);}.grn{fill:rgba(0,255,0,0.1);stroke:gray;}.move{animation:reveal 1.5s ease-out;}.lbl{font-size:10px;fill:orange;}@keyframes reveal{from{stroke-dashoffset:100;}to{stroke-dashoffset:0;}}</style><path class="grn" d="M110,10 L20,190 H200 Z"/><path class="grn" d="M290,10 L200,190 H380 Z"/><rect x="20" y="100" width="360" height="2" class="blue"/><text x="25" y="95" class="txt">Surface</text><line x1="200" y1="10" x2="200" y2="190" stroke="white" class="dash"/><circle cx="110" cy="10" r="3" fill="yellow"/><text x="80" y="15" class="txt">Src 1</text><circle cx="290" cy="10" r="3" fill="yellow"/><text x="300" y="15" class="txt">Src 2</text><line x1="155" y1="100" x2="245" y2="100" stroke="red" stroke-width="2"/><text x="180" y="95" class="txt" fill="red">GAP</text><path d="M110,10 L155,100" class="move" stroke="cyan" stroke-width="1.5" stroke-dasharray="100" stroke-dashoffset="100"/><path d="M290,10 L245,100" class="move" stroke="cyan" stroke-width="1.5" stroke-dasharray="100" stroke-dashoffset="100"/><path d="M200,100 V130" stroke="orange" class="dash"/><text x="205" y="120" class="lbl">d=${depth}</text></svg>`
            };
        }
    },
    {
        cat: 'Electron Isodose',
        generate: () => {
            const energies = [6, 9, 12, 15, 18, 20];
            const energy = energies[getRandomInt(0, energies.length - 1)];
            const isodoseLine = getRandomInt(0, 1) === 0 ? 80 : 90;
            const divisor = isodoseLine === 80 ? 3 : 4;
            
            const answer = energy / divisor;
            const options = [
                `${answer.toFixed(1)} cm`,
                `${(energy / (isodoseLine === 80 ? 4 : 3)).toFixed(1)} cm`,
                `${(energy / 2).toFixed(1)} cm`,
                `${(answer * 1.2).toFixed(1)} cm`
            ];
            
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${answer.toFixed(1)} cm`);

            return {
                cat: 'Electron Isodose',
                scenario: `Determine "X" (The Therapeutic Depth) for the ${isodoseLine}% isodose line.`,
                data: {
                    "Energy": `${energy} MeV`,
                    "Cone Size": "10x10",
                    "Bolus": "None",
                    "Prescription": `Treat to ${isodoseLine}% line`
                },
                hint: `${isodoseLine}% Depth ≈ E / ${divisor}`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Rule of Thumb: ${isodoseLine}% is E/${divisor}.</strong><br>The 80% isodose line is Energy / 3. The 90% line is E / 4.`,
                math: `X = ${energy} / ${divisor}\nX = ${answer.toFixed(1)} cm`
            };
        }
    },
    {
        cat: 'MU Calc (SAD)',
        generate: () => {
            const dose = getRandomInt(180, 250);
            const tmr = getRandomFloat(0.750, 0.850, 3);
            const trayFactor = getRandomFloat(0.95, 0.98, 2);
            
            const answer = dose / (1.0 * tmr * trayFactor);
            
            const options = [
                `${Math.round(answer)} MU`,
                `${Math.round(dose / tmr)} MU`, // Forgot tray
                `${Math.round(dose / (tmr * 0.655))} MU`, // used PDD
                `${Math.round(answer * 1.1)} MU`
            ];
            
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${Math.round(answer)} MU`);

            return {
                cat: 'MU Calc (SAD)',
                scenario: `Calculate "X" (MU Setting) for a single PA Isocentric field.`,
                data: {
                    "Rx Dose": `${dose} cGy`,
                    "Technique": "SAD (Isocentric)",
                    "TMR": `${tmr}`,
                    "PDD": `${getRandomFloat(0.6, 0.7, 3)}`,
                    "Output": "1.0 cGy/MU",
                    "Tray Factor": `${trayFactor}`,
                    "Modifiers": "Custom Cerrobend Blocks"
                },
                hint: `MU = Dose / (Output × TMR × Tray)`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Use TMR for SAD, ignore PDD.</strong><br>Blocks are present, so Tray Factor (${trayFactor}) must be included.`,
                math: `X = ${dose} / (1.0 × ${tmr} × ${trayFactor})\nX = ${dose} / ${(1.0 * tmr * trayFactor).toFixed(4)}\nX = ${answer.toFixed(1)} (Round to ${Math.round(answer)})`
            };
        }
    },
     {
        cat: `Wedge / Hinge Angle`,
        generate: () => {
            const hingeAngles = [60, 75, 90, 120];
            const hinge = hingeAngles[getRandomInt(0, hingeAngles.length-1)];
            const answer = (180 - hinge) / 2;
            const options = [
                `${answer}°`,
                `${180-hinge}°`,
                `${90-hinge}°`,
                `${answer + 15}°`,
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${answer}°`);

            return {
                cat: `Wedge / Hinge Angle`,
                scenario: `Calculate "X" (The Required Wedge Angle) for a Hinge Angle of ${hinge}°.`,
                data: {
                    "Hinge Angle": `${hinge}°`,
                    "Beam Energy": "6 MV",
                    "Field Size": "15x15"
                },
                hint: `Wedge = (180 - Hinge) / 2`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Wedge = (180 - Hinge) / 2.</strong><br>As beams get closer (smaller hinge), the wedge angle must get larger.`,
                math: `X = (180 - ${hinge}) / 2\nX = ${180-hinge} / 2\nX = ${answer}° Wedge`
            }
        }
    },
    {
        cat: 'Extended SSD (MU)',
        generate: () => {
            const oldMU = getRandomInt(180, 220);
            const oldSSD = 100;
            const newSSD = getRandomInt(110, 130);
            
            const answer = oldMU * Math.pow(newSSD / oldSSD, 2);

            const options = [
                `${Math.round(answer)} MU`,
                `${Math.round(oldMU * (oldSSD / newSSD)) } MU`,
                `${Math.round(oldMU * Math.pow(oldSSD / newSSD, 2)) } MU`,
                `${oldMU} MU`
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${Math.round(answer)} MU`);

            return {
                cat: 'Extended SSD (MU)',
                scenario: `The standard MU setting is ${oldMU} MU at ${oldSSD}cm SSD. Calculate "X" (New MU) required to deliver the SAME dose at ${newSSD}cm SSD.`,
                data: {
                    "Standard SSD": `${oldSSD} cm`,
                    "Treatment SSD": `${newSSD} cm`,
                    "Standard MU": `${oldMU} MU`,
                    "Dose Rate": "1.0 cGy/MU"
                },
                hint: `New MU = Old MU × (New Dist / Old Dist)²`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Distance Increases → Intensity Drops → MU must INCREASE.</strong><br>Since the beam is weaker at ${newSSD}cm, we need MORE monitor units to deliver the same dose.`,
                math: `X = ${oldMU} × (${newSSD} / ${oldSSD})²\nX = ${oldMU} × (${(newSSD/oldSSD).toFixed(2)})²\nX = ${oldMU} × ${(Math.pow(newSSD / oldSSD, 2)).toFixed(3)}\nX = ${answer.toFixed(1)} MU`
            };
        }
    },
    {
        cat: `Equivalent Square`,
        generate: () => {
            const side = getRandomInt(15, 25);
            const openArea = side * side;
            const blockedArea = getRandomInt(50, openArea / 2);
            const effectiveArea = openArea - blockedArea;
            const answer = Math.sqrt(effectiveArea);

            const options = [
                 `${answer.toFixed(1)} cm`,
                 `${Math.sqrt(openArea).toFixed(1)} cm`,
                 `${Math.sqrt(blockedArea).toFixed(1)} cm`,
                 `${(effectiveArea/4).toFixed(1)} cm`
            ];

            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${answer.toFixed(1)} cm`);
            
            return {
                cat: `Equivalent Square`,
                scenario: `Calculate "X" (Effective Square) for the blocked area shown.`,
                data: {
                    "Open Field": `${side} x ${side} cm`,
                    "Open Area": `${openArea} cm²`,
                    "Blocked Area": `${blockedArea} cm²`,
                    "Modifiers": "Standard Blocks"
                },
                hint: `EqSq = √(Open Area - Blocked Area)`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Square root of the *remaining* area.</strong><br>Effective Area = ${openArea} - ${blockedArea} = ${effectiveArea}.`,
                math: `X = √(${openArea} - ${blockedArea})\nX = √${effectiveArea}\nX = ${answer.toFixed(2)} cm`
            }
        }
    },
    {
        cat: 'PDD/TMR Conversion',
        generate: () => {
            const pdd = getRandomFloat(0.65, 0.85, 3);
            const ssd = 100;
            const depth = getRandomInt(8, 12);
            const dmax = [1.5, 2.5, 3.0][getRandomInt(0, 2)];
            const f_factor = Math.pow((ssd + depth) / (ssd + dmax), 2);
            const answer = pdd * f_factor;

            const options = [
                answer.toFixed(3),
                (pdd / f_factor).toFixed(3),
                (pdd * Math.sqrt(f_factor)).toFixed(3),
                pdd.toFixed(3)
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === answer.toFixed(3));

            return {
                cat: 'PDD/TMR Conversion',
                scenario: `Calculate "X" (the TMR) for a beam given the following SSD-based data.`,
                data: {
                    "PDD at depth": `${pdd}`,
                    "Depth (d)": `${depth} cm`,
                    "Depth of Dmax (dmax)": `${dmax} cm`,
                    "SSD": `${ssd} cm`
                },
                hint: `TMR ≈ PDD × [(SSD+d)/(SSD+dmax)]²`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>PDD is distance-dependent, TMR is not.</strong><br>This formula, a variation of the Mayneord F-Factor, corrects for the difference in beam divergence between an SSD setup (where PDD is measured) and an SAD setup (where TMR is used).`,
                math: `Factor = [(${ssd}+${depth})/(${ssd}+${dmax})]² = [${ssd+depth}/${ssd+dmax}]² = ${f_factor.toFixed(3)}\nX = ${pdd} × ${f_factor.toFixed(3)}\nX = ${answer.toFixed(3)}`,
                diagram: `<svg viewBox="0 0 420 130" xmlns="http://www.w3.org/2000/svg"><style>.small{font-family:monospace;font-size:9px;}.label{font-family:monospace;font-size:11px;fill:white;}</style><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs><text x="40" y="15" class="label">PDD (SSD Setup)</text><path d="M 100 20 L 20 120 L 180 120 Z" fill="rgba(0, 255, 0, 0.1)" stroke="gray" stroke-dasharray="2,2" /><circle cx="100" cy="20" r="3" fill="yellow" /><text x="105" y="22" class="small" fill="yellow">Src</text><rect x="20" y="80" width="160" height="4" fill="rgba(0,150,255,0.5)" /><text x="125" y="78" class="small" fill="cyan">Surface</text><circle cx="100" cy="100" r="2" fill="red" /><text x="105" y="102" class="small" fill="red">d</text><path d="M 80 20 V 80" stroke="currentColor" marker-end="url(#arrow)" marker-start="url(#arrow)" stroke-width="1" fill="none" color="orange" /><text x="50" y="55" class="small" fill="orange">SSD</text><text x="250" y="15" class="label">TMR (SAD Setup)</text><path d="M 300 20 L 220 120 L 380 120 Z" fill="rgba(0, 255, 0, 0.1)" stroke="gray" stroke-dasharray="2,2" /><circle cx="300" cy="20" r="3" fill="yellow" /><rect x="220" y="60" width="160" height="4" fill="rgba(0,150,255,0.5)" /><text x="325" y="58" class="small" fill="cyan">Surface</text><circle cx="300" cy="80" r="2" fill="red" /><text x="305" y="82" class="small" fill="red">Iso</text><path d="M 280 20 V 80" stroke="currentColor" marker-end="url(#arrow)" marker-start="url(#arrow)" stroke-width="1" fill="none" color="orange" /><text x="250" y="55" class="small" fill="orange">SAD</text></svg>`
            }
        }
    },
    {
        cat: 'Electron MU Calc',
        generate: () => {
            const dose = getRandomInt(20, 30) * 10;
            const isodoseLine = [80, 90, 95][getRandomInt(0, 2)];
            const outputFactor = getRandomFloat(0.95, 1.05, 3);

            const answer = dose / (outputFactor * (isodoseLine / 100));
            const options = [
                `${Math.round(answer)} MU`,
                `${Math.round(dose / outputFactor)} MU`,
                `${Math.round(dose / (isodoseLine/100))} MU`,
                `${Math.round(answer * 0.8)} MU`
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${Math.round(answer)} MU`);

            return {
                cat: 'Electron MU Calc',
                scenario: `Calculate "X" (the MU setting) for an electron field.`,
                data: {
                    "Rx Dose": `${dose} cGy`,
                    "Prescription Line": `${isodoseLine}%`,
                    "Cone Output Factor": `${outputFactor}`,
                    "Dose Rate": `1.0 cGy/MU`
                },
                hint: `MU = Dose / (Output Factor × Rx Isodose%)`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>For electrons, divide dose by all factors.</strong><br>The final MU is the prescribed dose divided by the output for that specific cone and the isodose line you are treating to (as a decimal).`,
                math: `X = ${dose} / (${outputFactor} × ${isodoseLine / 100})\nX = ${dose} / ${(outputFactor * (isodoseLine / 100)).toFixed(3)}\nX = ${answer.toFixed(1)} MU`
            }
        }
    },
    {
        cat: 'Field Weighting',
        generate: () => {
            const totalDose = getRandomInt(25, 40) * 10;
            const ratio1 = getRandomInt(2, 4);
            const ratio2 = getRandomInt(1, ratio1 - 1);
            const totalParts = ratio1 + ratio2;
            const dosePerPart = totalDose / totalParts;
            const dose1 = dosePerPart * ratio1;

            const options = [
                `${Math.round(dose1)} cGy`,
                `${Math.round(dosePerPart * ratio2)} cGy`,
                `${Math.round(totalDose / ratio1)} cGy`,
                `${Math.round(totalDose - ratio1)} cGy`
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${Math.round(dose1)} cGy`);

            return {
                cat: 'Field Weighting',
                scenario: `AP/PA fields are weighted ${ratio1}:${ratio2} to deliver a total midplane dose of ${totalDose} cGy. Calculate "X" (dose from the AP field, which has weight ${ratio1}).`,
                data: {
                    "Total Dose": `${totalDose} cGy`,
                    "Weight Ratio (AP:PA)": `${ratio1}:${ratio2}`,
                    "Beam Arrangement": "Parallel Opposed"
                },
                hint: `Dose = Total Dose × (Field Weight / Total Weight)`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>Calculate dose per 'part'.</strong><br>Total parts = ${ratio1} + ${ratio2} = ${totalParts}. Dose per part = ${totalDose} / ${totalParts}. The AP field gets ${ratio1} parts.`,
                math: `Dose/Part = ${totalDose} cGy / (${ratio1} + ${ratio2}) = ${dosePerPart.toFixed(1)} cGy\nAP Dose = ${dosePerPart.toFixed(1)} × ${ratio1}\nAP Dose = ${dose1.toFixed(1)} cGy`
            }
        }
    },
    {
        cat: 'Plan Normalization',
        generate: () => {
            const isoDose = 200;
            const hotspotPercent = getRandomInt(105, 115);
            const newIsoDose = isoDose * (100 / hotspotPercent);

            const options = [
                `${newIsoDose.toFixed(1)} cGy`,
                `${(isoDose * (hotspotPercent/100)).toFixed(1)} cGy`,
                `${(isoDose - (hotspotPercent - 100)).toFixed(1)} cGy`,
                `${isoDose} cGy`,
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === `${newIsoDose.toFixed(1)} cGy`);

            return {
                cat: 'Plan Normalization',
                scenario: `A plan delivering ${isoDose} cGy to isocenter has a hotspot of ${hotspotPercent}%. If the plan is renormalized so this hotspot becomes the new 100% point, what is "X" (the new isocenter dose)?`,
                data: {
                    "Original Iso Dose": `${isoDose} cGy`,
                    "Original Iso %": "100%",
                    "Hotspot %": `${hotspotPercent}%`,
                    "New Norm Point": "Hotspot"
                },
                hint: `New Dose = Old Dose × (Old % / New Norm Point's Old %)`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>All doses scale proportionally.</strong><br>The original isocenter was 100%. The hotspot was ${hotspotPercent}%. By making the hotspot the new 100%, you are scaling the entire plan down by a factor of 100/${hotspotPercent}.`,
                math: `Scale Factor = 100 / ${hotspotPercent} = ${(100/hotspotPercent).toFixed(4)}\nNew Iso Dose = ${isoDose} cGy × ${(100/hotspotPercent).toFixed(4)}\nNew Iso Dose = ${newIsoDose.toFixed(1)} cGy`
            }
        }
    },
    {
        cat: 'Couch Kick Trigonometry',
        generate: () => {
            const angle = getRandomInt(20, 45);
            const shift = getRandomInt(3, 8);
            const angleRad = angle * Math.PI / 180;
            const longShift = shift * Math.cos(angleRad);
            const vertShift = shift * Math.sin(angleRad);
            
            const answer = `LONG: ${longShift.toFixed(1)} cm, VERT: ${vertShift.toFixed(1)} cm`;
            const options = [
                answer,
                `LONG: ${vertShift.toFixed(1)} cm, VERT: ${longShift.toFixed(1)} cm`, // Swapped
                `LONG: ${(shift * Math.tan(angleRad)).toFixed(1)} cm, VERT: ${vertShift.toFixed(1)} cm`, // Wrong function
                `LONG: ${longShift.toFixed(1)} cm, VERT: ${(shift / Math.sin(angleRad)).toFixed(1)} cm`, // Wrong function
            ];
            const shuffled = shuffleArray(options);
            const correctIndex = shuffled.findIndex(opt => opt === answer);

            return {
                cat: 'Couch Kick Trigonometry',
                scenario: `The couch is kicked ${angle}°. To treat an off-axis target, isocenter must be shifted ${shift} cm superiorly along the tilted gantry plane. Calculate "X" (the required LONG and VERT couch shifts).`,
                data: {
                    "Couch Kick": `${angle}°`,
                    "Required Shift (Hypotenuse)": `${shift} cm`,
                    "Gantry Angle": "0°"
                },
                hint: `SOH CAH TOA. LONG is Adjacent (cos), VERT is Opposite (sin).`,
                options: shuffled,
                correct: correctIndex,
                expl: `<strong>This forms a right triangle.</strong><br>The hypotenuse is the ${shift} cm shift. The couch kick angle is ${angle}°. The longitudinal shift is the adjacent side, and the vertical shift is the opposite side.`,
                math: `LONG (Y) = Hypotenuse × cos(angle) = ${shift} × cos(${angle}°) = ${longShift.toFixed(2)} cm\nVERT (Z) = Hypotenuse × sin(angle) = ${shift} × sin(${angle}°) = ${vertShift.toFixed(2)} cm`,
                diagram: `<svg viewBox="0 0 250 150" xmlns="http://www.w3.org/2000/svg"><style>.txt{font-family:monospace;font-size:12px;fill:white;}.dash{stroke-dasharray:2,2;}.move{animation:draw 1.5s ease-out;}@keyframes draw{from{stroke-dashoffset:200;}to{stroke-dashoffset:0;}}</style><path d="M50 120 L 200 120 L 200 40 Z" fill="rgba(0,150,255,0.1)" stroke="cyan" stroke-width="2"/><path d="M 50 120 L 200 40" stroke="orange" stroke-width="2.5" class="move" stroke-dasharray="200" stroke-dashoffset="200"/><text x="110" y="70" class="txt" fill="orange">Shift=${shift}cm</text><text x="60" y="115" class="txt">LONG=?</text><text x="205" y="80" class="txt">VERT=?</text><path d="M 180 120 A 20 20, 0, 0, 0, 200 100" fill="none" stroke="red" stroke-width="1.5"/><text x="170" y="110" class="txt" fill="red">${angle}°</text></svg>`
            }
        }
    }
];

export function generateQuestions(count: number, categories?: string[]): Question[] {
    let templatesToUse = questionTemplates;

    if (categories && categories.length > 0) {
        templatesToUse = questionTemplates.filter(t => categories.includes(t.cat));
    }
    
    if (templatesToUse.length === 0) {
        // Fallback to all questions if selection is empty for some reason
        templatesToUse = questionTemplates;
    }

    const questions: Question[] = [];
    const shuffledTemplates = shuffleArray(templatesToUse);

    for (let i = 0; i < count; i++) {
        const template = shuffledTemplates[i % shuffledTemplates.length];
        questions.push(template.generate());
    }
    return questions;
}
