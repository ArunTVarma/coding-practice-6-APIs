const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1 Returns a list of all states in the state table

const getStatesList = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states/", async (request, response) => {
  try {
    const getStatesQuery = `
    select * from state;`;
    const statesList = await db.all(getStatesQuery);
    response.send(statesList.map((eachState) => getStatesList(eachState)));
    //response.send(statesList);
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
});

//API 2 Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateBasedOnIDQuery = `
        select * from state where state_id=${stateId};`;
    const getState = await db.get(getStateBasedOnIDQuery);
    response.send(getStatesList(getState));
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

// API 3 Create a district in the district table

app.post("/districts/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const postDistrictQuery = `
        INSERT INTO
        district (district_name,state_id,cases,cured,active,deaths)
        VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
    const districtAdded = await db.run(postDistrictQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.log(`Error: ${e.message}`);
    process.exit(1);
  }
});

//API 4 Returns a district based on the district ID

const getDistrictInreqFormat = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

// API 4A to get all districts

app.get("/districts/", async (request, response) => {
  const getALLDistrictsQuery = `
    select * from district;`;
  const AlldistrictsList = await db.all(getALLDistrictsQuery);

  response.send(AlldistrictsList);
});

//API 4B Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  select * from district
  where district_id = ${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(getDistrictInreqFormat(getDistrict));
});

//API 5 Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const delDistrictQuery = `
        DELETE FROM DISTRICT 
        WHERE district_id=${districtId}`;
    await db.run(delDistrictQuery);
    response.send("District Removed");
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 6 Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const { districtId } = request.params;
    const putDistrictQuery = `
    UPDATE 
        DISTRICT
    SET 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
        WHERE 
        district_id = ${districtId};`;
    await db.run(putDistrictQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

// API 7 Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStatesStatsQuery = `
        select
            sum(cases),
            sum(cured),
            sum(active),
            sum(deaths)
        from 
            district
        where 
            state_id = ${stateId};`;
    const stats = await db.get(getStatesStatsQuery);
    console.log(stats);
    response.send({
      totalCases: stats["sum(cases)"],
      totalCured: stats["sum(cured)"],
      totalActive: stats["sum(active)"],
      totalDeaths: stats["sum(deaths)"],
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

//API 8 Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
  select state_id from district 
  where district_id =${districtId};`;
  // using this we have to get state_id using district table

  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
  select state_name as stateName from state
  where 
  state_id = ${getDistrictIdQueryResponse.state_id};`;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
