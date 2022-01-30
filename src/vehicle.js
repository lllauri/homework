import { DateTime } from "luxon";

export default () => ({
  apiKey: "home.assignment-699172",
  vehicleLoading: false,
  vehicles: [],
  isActive: "",
  selectedDate: "",
  //home.assignment-699172

  fetchVehicles() {
    this.vehicleLoading = true;

    fetch(
      `https://app.ecofleet.com/seeme/Api/Vehicles/getLastData?key=${this.apiKey}&json`
    )
      .then((res) => res.json())
      .then((data) => {
        this.vehicles = data.response;
        this.vehicleLoading = false;
      })
      .catch((error) => {
        //TODO handle errors
        this.vehicleLoading = false;
        console.log(error);
      });
  },

  toggleVehicle(id) {
    this.isActive = this.isActive == id ? "" : id;
  },

  showTimeAgo(date) {
    const tzDateTime = DateTime.fromSQL(date, { zone: "Europe/Tallinn" });

    return tzDateTime.toRelative();
  },
});
