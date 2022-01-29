import { Loader } from "@googlemaps/js-api-loader";
import { DateTime } from "luxon";

export default () => ({
  markers: [],
  mapLoading: false,
  polyLine: [],

  // data related to path calculations
  activeVehicleData: [],
  totalDistance: false,
  stops: false,
  shortestDistance: false,

  init() {
    const GOOGLE_API_KEY = ***REMOVED***;
    const loader = new Loader({ apiKey: GOOGLE_API_KEY });

    loader.load().then(function (google) {
      türi = { lat: 58.802, lng: 25.424 };

      map = new google.maps.Map(document.getElementById("map"), {
        center: türi,
        zoom: 7,
      });
    });
  },

  setActiveVehicleData(data) {
    this.activeVehicleData = data;
    this.setPolyLine();
    this.setTotalDistance();
    const startsAndStops = this.getStartsAndStops();
    this.setStops(startsAndStops.stops.length);
    this.setShortestDistance(startsAndStops);
  },

  setPolyLine() {
    let coords = [];

    this.hideMarkers();

    if (this.polyLine.length > 0) {
      this.deletePolyLine();
    }

    for (step of this.activeVehicleData) {
      if (step.Latitude != null && step.Longitude != null) {
        coords.push({ lat: step.Latitude, lng: step.Longitude });
      }
    }

    const polyLine = new google.maps.Polyline({
      path: coords,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    polyLine.setMap(map);
    this.zoomToObject(polyLine);

    this.polyLine.push(polyLine);
  },

  setTotalDistance() {
    let start = 0;
    let stop = 0;
    let distance = false;

    if (this.activeVehicleData.length > 0) {
      start = this.activeVehicleData[0];
      stop = this.activeVehicleData[this.activeVehicleData.length - 1];

      const keys = Object.keys(start);
      const key = keys.includes("DeltaDistance") ? "DeltaDistance" : "Distance";

      distance = (stop[key] - start[key]).toFixed(2);
    }

    this.totalDistance = distance ? distance + " KM" : false;
  },

  setStops(stops) {
    this.stops = stops;
  },

  setShortestDistance(startsAndStops) {
    this.deleteMarkers();

    for (const stop of startsAndStops.stops) {
      const marker = new google.maps.Marker({ stop, map });
      this.markers.push({ id: 0, marker: marker });
    }

    this.putMarkersOnMap(map);
  },

  getStartsAndStops() {
    const activeVehicleData = this.activeVehicleData;

    // acc {stops: [{Lat: Lng: }, .. ], starts: [{Lat: , Lng: }]
    const reducer = (acc, current) => {
      if (acc.starts.length == acc.stops.length && current.Speed != null) {
        acc.starts.push({ Lat: current.Latitude, Lng: current.Longitude });
      }

      if (acc.starts.length > acc.stops.length && [0, null].includes(current.Speed)) {
        acc.stops.push({ Lat: current.Latitude, Lng: current.Longitude });
      }

      return acc;
    };

    startsAndStops = activeVehicleData.reduce(reducer, {
      starts: [],
      stops: [],
    });
    // maybe need additional filter if two consecutive stops are really close together

    console.log(startsAndStops);

    return startsAndStops;
  },

  fetchVehicleData(vehicleId, dateString) {
    function nextDayString(dateString) {
      const day = DateTime.fromISO(dateString);
      const nextDay = day.plus({ days: 1 });

      return nextDay.toISODate();
    }

    this.mapLoading = true;

    nextDayString = nextDayString(dateString);

    fetch(
      `https://app.ecofleet.com/seeme/Api/Vehicles/getRawData?objectId=${vehicleId}&begTimestamp=${dateString}&endTimestamp=${nextDayString}&key=${this.apiKey}&json`
    )
      .then((res) => res.json())
      .then((data) => {
        this.setActiveVehicleData(data.response);

        this.mapLoading = false;
      })
      .catch((error) => {
        //TODO handle errors
        this.mapLoading = false;
        console.log(error);
      });
  },

  putMarkersOnMap(map) {
    for (markerInfo of this.markers) {
      console.log("Setting marker to map", markerInfo.id, map);
      markerInfo.marker.setMap(map);
    }
  },

  drawVehicleMarkers(vehicles) {
    for (const vehicleObj of vehicles) {
      const position = { lat: vehicleObj.latitude, lng: vehicleObj.longitude };
      const marker = new google.maps.Marker({ position, map });
      this.markers.push({ id: vehicleObj.objectId, marker: marker });
    }

    this.putMarkersOnMap(map);
  },

  focusVehicleMarker(vehicleId) {
    for (markerInfo of this.markers) {
      if (vehicleId != "" && vehicleId == markerInfo.id) {
        map.panTo(markerInfo.marker.getPosition());
      }
    }
  },

  zoomToObject(obj) {
    let bounds = new google.maps.LatLngBounds();
    const points = obj.getPath().getArray();
    for (let n = 0; n < points.length; n++) {
      bounds.extend(points[n]);
    }
    map.fitBounds(bounds);
  },

  hideMarkers() {
    this.putMarkersOnMap(null);
  },

  deleteMarkers() {
    this.hideMarkers();
    this.markers = [];
  },

  hidePolyLine() {
    console.log("hide polyLine");
    console.log(this.polyLine);
    for (line of this.polyLine) {
      line.setMap(null);
    }
  },

  deletePolyLine() {
    this.hidePolyLine();
    this.polyLine = [];
  },
});
