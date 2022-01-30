import { Loader } from "@googlemaps/js-api-loader";
import { DateTime } from "luxon";

export default () => ({
  markers: [],
  polyLine: null,
  mapLoading: false,

  // data related to path calculations
  isCalculating: false,
  activeVehicleData: [],
  totalDistance: false,
  stops: false,
  shortestDistance: false,

  init() {
    const GOOGLE_API_KEY =
      "QUl6YVN5Q0MtMlhvWE1WRE9Eam1JS2EzU09fOU1YbDFMSmpVZ0c4";
    const loader = new Loader({ apiKey: atob(GOOGLE_API_KEY) });

    loader.load().then(function (google) {
      türi = { lat: 58.802, lng: 25.424 };

      map = new google.maps.Map(document.getElementById("map"), {
        center: türi,
        zoom: 8,
      });
    });
  },

  setActiveVehicleData(data) {
    this.activeVehicleData = data;
    this.setTotalDistance();

    if (data.length > 0) {
      this.setPolyLine();
      const startsAndStops = this.getStartsAndStops();

      if (startsAndStops.starts.length > 0) {
        this.setStops(startsAndStops.stops.length);
        this.setShortestDistance(startsAndStops);
      }
    }
  },

  setPolyLine() {
    let coords = [];

    this.hideMarkers();

    if (this.polyLine != null) {
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
    this.zoomToPolyLine(polyLine);

    this.polyLine = polyLine;
  },

  setTotalDistance() {
    let start = 0;
    let stop = 0;
    let distance = null;

    if (this.activeVehicleData.length > 0) {
      start = this.activeVehicleData[0];
      stop = this.activeVehicleData[this.activeVehicleData.length - 1];

      const keys = Object.keys(start);
      const key = keys.includes("DeltaDistance") ? "DeltaDistance" : "Distance";

      distance = (stop[key] - start[key]).toFixed(2);
    }

    distance =
      distance == null
        ? "No data"
        : distance == "0.00"
        ? "Not reported"
        : distance + " KM";

    this.totalDistance = distance;
  },

  setStops(stops) {
    this.stops = stops;
  },

  async setShortestDistance(startsAndStops) {
    // DEBUG code, doesn't work, need to debug this too
    // this.deleteMarkers();

    // let markers = [];

    // for (stop of startsAndStops.stops) {
    //   let marker = new google.maps.Marker({ stop, map });
    //   markers.push({ id: 0, marker: marker });
    // }

    // this.markers = markers;

    // this.putMarkersOnMap(map);

    this.shortestDistance = false;
    this.isCalculating = true;
    const directionsService = new google.maps.DirectionsService();
    const sleepNow = (delay) =>
      new Promise((resolve) => setTimeout(resolve, delay));

    let routes = this.divideToRoutes(startsAndStops);
    let shortestDistance = 0;

    for (const route of routes) {
      await directionsService
        .route(route)
        .then((response) => {
          const route = response.routes[0];
          let routeDistance = 0;

          for (const leg of route.legs) {
            legDistance = leg.distance ? leg.distance.value : 0;
            routeDistance += legDistance;
          }

          routeDistance = routeDistance / 1000;
          shortestDistance += routeDistance;
        })
        .catch((error) => {
          console.log(error);
        });

      await sleepNow(500);
    }

    this.isCalculating = false;
    this.shortestDistance = shortestDistance.toFixed(2) + " KM";
  },

  divideToRoutes(startsAndStops) {
    // Google API limits one request to 10 nodes max
    // we will chunk the stops by 10 with 1 node overlap
    // so the last point of one chunk is the first point of next chunk
    const chunk = 10;

    let start = startsAndStops.starts[0];
    let stops = startsAndStops.stops;
    stops.unshift(start);

    routes = generateRoutes(stops);

    return routes;

    function generateRoutes(stopsArray) {
      let routes = [];

      for (let i = 0; i < stopsArray.length; i += chunk - 1) {
        let chunkArray = stopsArray.slice(i, i + chunk);

        let chunkStart = new google.maps.LatLng(chunkArray[0]);
        let chunkEnd = new google.maps.LatLng(
          chunkArray[chunkArray.length - 1]
        );
        let waypoints = [];

        for (let i = 1; i < chunkArray.length - 1; i++) {
          let point = new google.maps.LatLng(chunkArray[i]);
          let waypoint = { location: point, stopover: true };

          waypoints.push(waypoint);
        }

        routes.push({
          origin: chunkStart,
          destination: chunkEnd,
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        });
      }

      return routes;
    }
  },

  getStartsAndStops() {
    const activeVehicleData = this.activeVehicleData;

    // acc {stops: [{lat: Lng: }, .. ], starts: [{lat: , Lng: }]
    const reducer = (acc, current) => {
      if (
        acc.starts.length == acc.stops.length &&
        ![0, null].includes(current.Speed)
      ) {
        acc.starts.push({ lat: current.Latitude, lng: current.Longitude });
      }

      if (
        acc.starts.length > acc.stops.length &&
        [0, null].includes(current.Speed)
      ) {
        acc.stops.push({ lat: current.Latitude, lng: current.Longitude });
      }

      return acc;
    };

    startsAndStops = activeVehicleData.reduce(reducer, {
      starts: [],
      stops: [],
    });

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

  drawVehicleMarkers(vehicles) {
    for (const vehicleObj of vehicles) {
      const position = { lat: vehicleObj.latitude, lng: vehicleObj.longitude };
      let marker = new google.maps.Marker({ position, map });
      this.markers.push({ id: vehicleObj.objectId, marker: marker });
    }

    this.putMarkersOnMap(map);
  },

  focusVehicleMarker(vehicleId) {
    for (const markerInfo of this.markers) {
      if (vehicleId != "" && vehicleId == markerInfo.id) {
        map.panTo(markerInfo.marker.getPosition());
      }
    }
  },

  zoomToPolyLine(polyLine) {
    let bounds = new google.maps.LatLngBounds();
    const points = polyLine.getPath().getArray();
    for (point of points) {
      bounds.extend(point);
    }
    map.fitBounds(bounds);
  },

  putMarkersOnMap(mapObj) {
    for (let i = 0; i < this.markers.length; i++) {
      if (mapObj == null) {
        this.markers[i].marker.setPosition(null);
      }
      this.markers[i].marker.setMap(mapObj);
    }
  },

  hideMarkers() {
    this.putMarkersOnMap(null);
  },

  hidePolyLine() {
    // does not work
    this.polyLine.setMap(null);
  },

  deleteMarkers() {
    this.hideMarkers();
    this.markers = [];
  },

  deletePolyLine() {
    this.hidePolyLine();
    this.polyLine = null;
  },
});
