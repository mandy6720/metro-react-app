import React, { useEffect, useState } from 'react';
import axios from "axios";
import './App.css';

const organizeTrains = (currentTrains) => {
  const trainsByDesination = {};

  currentTrains.forEach((train) => {
    // looks for line property on trainsByDestination Obj
    if (trainsByDesination.hasOwnProperty(train.Line)) {
      // if line exists, look for desination prop - ex trainsByDestination.Rd.Shadygrove
      // if exists, add to desintation array
      if (trainsByDesination[train.Line].hasOwnProperty(train.DestinationCode)) {
        // destinationCode will be an array of trains if it exists
        trainsByDesination[train.Line][train.DestinationCode].push(train);
      }
      // else create destination prop to line and add train
      else {
        trainsByDesination[train.Line][train.DestinationCode] = [train];
      }
    }
    // else add line and desintation
    else {
      const newLine = {};
      // { destination: [] }
      newLine[train.DestinationCode] = [train];
      // trainsByDestination: { Rd: { Shadygrove: [] }}
      trainsByDesination[train.Line] = newLine;
    }
  });
  return trainsByDesination;
}

const App = () => {
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedStationName, setSelectedStationName] = useState(null);
  const [currentTrains, setCurrentTrains] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_RAIL_INFO_API}/jStations?api_key=${process.env.REACT_APP_SECRET}`)
      .then((payload) => setStationList(payload.data.Stations));
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      getStationPredictions(selectedStation)
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedStation]);

  const getStationPredictions = (station) => {
    if (station) {
      axios.get(`${process.env.REACT_APP_PREDICTION_API}/${station}?api_key=${process.env.REACT_APP_SECRET}`)
      .then((payload) => {
        payload.data.Trains.length && setSelectedStationName(payload.data.Trains[0].LocationName)
        // setting trains for current station
        setCurrentTrains(payload.data.Trains);
      });
    }
  }

  const handleStationSelect = (event) => {
    setSelectedStation(event.target.value);
  }

  const createTableMarkup = (arr) => {
    return (<ul>
      {arr.map((train) => {
        const { DestinationName, Line, Min } = train;
        return (<li>{`${Line} ${DestinationName} will arrive in ${Min} mins`}</li>)
      })}
    </ul>);
  }

  const displayTrains = () => {
    const trains = [];
    currentTrains.sort((a, b) => {
      if (a.DestinationName < b.DestinationName) {
        return -1;
      }
      if (a.DestinationName > b.DestinationName) {
        return 1;
      }
      return 0;
    });

    const trainsByDesination = organizeTrains(currentTrains);

    // Split into line color arrays
    const lines = Object.keys(trainsByDesination);
    // For each line, get array for each destination
    lines.forEach(line => {
      const lineDestinations = Object.keys(trainsByDesination[line]);
      // for each destination, create table
      lineDestinations.forEach(dest => {
        const destTrains = trainsByDesination[line][dest];
        // for each destination, create table
        return trains.push(destTrains);
      })
    })
    return trains.map(item => createTableMarkup(item));
  };

  return (
    <div className="App">
      <label htmlFor="stations">Stations:</label>
      {stationList.length && (<select name="stations" onChange={handleStationSelect}>
        <option value={null}>Select a station</option>
        {stationList.map((item) => <option value={item.Code}>{item.Name}</option>)}
      </select>)}
      {selectedStationName && <div>Current Station: {selectedStationName}</div>}
      {currentTrains && currentTrains.length ? displayTrains() : "No trains at this time"}
    </div>
  );
}

export default App;
