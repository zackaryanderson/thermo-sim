//TO START: type "node thermoSim" in terminal while in the files base directory

//Assumptions
// - Sunny Day
// - No energy removed from the system
// - adiabatic piping/ no heat loss from pipes
// - Solar panel is 1.4 meters large
// - adiabatic pump, only adds enough energy to account for friction losses on pipes
// - water tank insulation has R-Value of 8 = 8 / 5.678 = RSI value

//import library that allows us to do basic math functions.
const math = require("math.js");

//water tank (Temperature [C] per kilogram in the tank [bottom->top])
//waterTank = [80, 80, 81, 81, 82, 82, 83, 83, 84, 84];
waterTank = [80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
    81, 81, 81, 81, 81, 81, 81, 81, 81, 81,
    82, 82, 82, 82, 82, 82, 82, 82, 82, 82,
    83, 83, 83, 83, 83, 83, 83, 83, 83, 83,
    84, 84, 84, 84, 84, 84, 84, 84, 84, 84,
    85, 85, 85, 85, 85, 85, 85, 85, 85, 85
];

//function to simulate solar thermal system and heat water tank to desired value.
//outputs tank water temperatures per block of water and time it took to heat to those temperatures.
function heatWaterToTemp(tankVals, desTemp) {

    //establish constants
    let sun = 340; //Watts/m^2   energy provided by the sun per square meter
    let solarConv = 0.215; //average solar conversion rate by panel as a percent
    let avgSolarPanelArea = 1.4; //m^2 average size of a solar panel
    let Dpipes = 0.1; //m
    let A_pipes = Math.PI * Math.pow((Dpipes / 2), 2); //m^2
    let vel = 1; //m/s massFlowRate/area_pipes;
    let massFlowRate = vel * A_pipes; //m^3/s = kg/s = L/s
    let R = 8 / 5.67826; //m^2K/W insulation value of water tank in metric units
    let blockSize = 10; // kg each array value is a block of water
    let waterVol = tankVals.length * blockSize; // total mass of water in kg
    let T_room = 20; //C room temperature where water is stored
    let h_tank = 1.5; //m height of the water tank
    let r_tank = Math.sqrt((waterVol * 0.001) / (Math.PI * h_tank)); //m radius of water tank
    let A_waterBlock = 2 * Math.PI * r_tank * (h_tank/tankVals.length) + 2 * Math.PI * Math.pow(r_tank, 2); //m^2 area of tank
    let L_pipes_total = 12; //m total length of pipes in system.
    let time_total = (L_pipes_total * A_pipes) / massFlowRate; //s total time it takes water to go through the system and back into the tank
    let h = 0.58;//1000; //W/m^2C convective heat transfer coefficient of water
    let A_cond = 2 * Math.PI * Math.pow(r_tank, 2);
    let L_pipes_solar = 8.2; //m <- 7 turns in pipe (2.857cm/each) and 8 long sections (1m/each)

    //establish iterator for while loop
    //each iteration represents one cubic meter of water flowing through the system
    let iter = 0;
    let time_toHeat = 0;

    //loop through entire system 
    while (Math.min(...tankVals) < desTemp) {
        //take the bottom water out of the tank to be manipulated
        waterCycled = tankVals[0];

        //energy added by solar panel
        let addedE = (sun * solarConv * avgSolarPanelArea) * ((L_pipes_solar * A_pipes) / massFlowRate); // J/s provided by the sun multiplied by the time it takes the water to pass through the solar panel

        //establish new tank for a placeholder to model in-tank conduction 
        newTank = [];

        //move all water down the tank and increase/decrease energy depending on convection
        for (let i = 0; i < tankVals.length - 1; i++) {
            newTank[i] = (tankVals[i + 1]);
        }

        //model conduction inside of water tank. Do this for amount of time it takes to cycle through entire system.
        for (let j = 0; j < time_total; j++) {
            for (let i = 0; i < newTank.length - 1; i++) {
                //equilibriate temperatures in tank due to conduction
                if (newTank[i + 1]) {
                    if (newTank[i] < newTank[i + 1]) {
                        let Q_bal = (h * A_cond * (newTank[i + 1] - newTank[i])) - ((A_waterBlock * (T_room - newTank[i])) / (R)); //heat transfer of j to next block of water and subtract heat lost to convection on the tank walls
                        newTank[i] = newTank[i] + (Q_bal / (blockSize * 4180)); //add conducted energy to colder block of water
                        newTank[i + 1] = newTank[i + 1] + ((h * A_cond * (newTank[i] - newTank[i + 1])) / (blockSize * 4180)); //remove conducted energy from hotter block of water
                    }
                }
            }
        }

        //add energy to cycled water and compute new temp
        waterCycled = waterCycled + (addedE / (blockSize * 4180)); //q = mc*deltaT

        //add the heated water back to the top of the tank
        newTank.push(waterCycled);

        //assign the new tank placeholder back to the original array.
        tankVals = newTank;
        iter++
        time_toHeat = (iter * time_total); //calculate how long the simulation runs for

        //break loop if the system equillibriates and does not meet desired temp
        if (time_toHeat > 1000000) {
            res = { tankVals: tankVals, time: time_toHeat };
            return res;
        }
    }

    res = { tankVals: tankVals, time: time_toHeat };
    return res;
};

//ans = heatWater(waterTank);
ans = heatWaterToTemp(waterTank, 90);

console.log(ans.tankVals);

if (ans.time > 3600) {
    console.log("Time to heat to desired temp: " + (ans.time / 3600).toFixed(2) + " hours")
} else if (ans.time > 60) {
    console.log("Time to heat to desired temp: " + (ans.time / 60).toFixed(2) + " minutes")
} else {
    console.log("Time to heat to desired temp: " + (ans.time).toFixed(2) + " seconds")
}
