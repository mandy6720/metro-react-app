import React, { useEffect, useState } from 'react';
import axios from "axios";
import './App.css';

const App = () => {
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedStationName, setSelectedStationName] = useState(null);
  const [currentTrains, setCurrentTrains] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_RAIL_INFO_API}/jStations?api_key=${process.env.REACT_APP_SECRET}`)
      .then((payload) => setStationList(payload.data.Stations));
  }, [])

  const handleStationSelect = (event) => {
    setSelectedStation(event.target.value);
    axios.get(`${process.env.REACT_APP_PREDICTION_API}/${event.target.value}?api_key=${process.env.REACT_APP_SECRET}`)
    .then((payload) => {
      payload.data.Trains.length && setSelectedStationName(payload.data.Trains[0].LocationName)
      // setting trains for current station
      setCurrentTrains(payload.data.Trains);
    });
  }

  const displayTrains = () => {
    currentTrains.sort((a,b) => {
      if (a.DestinationName < b.DestinationName) {
        return -1;
      }
      if (a.DestinationName > b.DestinationName) {
        return 1;
      }
      return 0;
    });

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

    console.log("trainsByDesination", trainsByDesination)

    return (<ul>
      {currentTrains.map((train) => {
      const { DestinationName, Line, Min } = train;
        return (<li>{`${Line} ${DestinationName} will arrive in ${Min} mins`}</li>)
      })}
    </ul>);
  };

  return (
    <div className="App">
      <label htmlFor="stations">Stations:</label>
      {stationList.length && (<select name="stations" onChange={handleStationSelect}>
        {stationList.map((item) => {
          return (<option value={item.Code}>{item.Name}</option>);
        })}
      </select>)}
      {selectedStationName && <div>Current Station: {selectedStationName}</div>}
      {currentTrains && displayTrains()}
    </div>
  );
}

export default App;
