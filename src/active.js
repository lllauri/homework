// export default () => ({
//     activeVehicleData: [],
//     totalDistance: false,
//     stops: false,
//     shortestDistance: false,

//     setActiveVehicleData(data) {
//         this.activeVehicleData = data;
//         this.setTotalDistance();
//         this.setStops();
//         this.setShortestDistance();
//     },

//     setTotalDistance() {
//         let start = 0;
//         let stop = 0;
//         let distance = false;

//         if (this.activeVehicleData.length > 0) {
//             console.log(this.activeVehicleData);
//             start = this.activeVehicleData[0];
//             stop = this.activeVehicleData[this.activeVehicleData.length-1];

//             console.log(stop);

//             distance = stop['DeltaDistance'].toFixed(2) - start['DeltaDistance'].toFixed(2);
//         };

//         this.totalDistance = distance ? distance + ' KM' : false
//     },

//     setStops() {

//     },

//     setShortestDistance() {

//     },
// })
