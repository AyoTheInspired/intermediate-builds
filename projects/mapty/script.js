'use strict';

class Workout {
  // Date - to be displayed on each workout card
  date = new Date();

  // ID - this should usually be generated by external libraries
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  // Constructor with parameters common to both workout styles
  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

// The two unique workout classes
// Running class
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  // Calculating pace
  calcPace() {
    // Pace is defined in minutes per km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Cycling class
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  // Calculating speed
  calcSpeed() {
    // Speed is measured in km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 527, 95, 523);

//////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
// REQUIRED VARIABLES

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  // Private instance properties - to be present on all properties used by this class
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position immediately application loads
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    // Using the Geolocation API
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  // Get coordinates and show on map when page loads
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      this._renderWorkoutMarker(work);
    });
  }

  // Show side form when user clicks on map
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // 8) Hide form and clear input fields
  _hideForm() {
    // Empty inputs
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Toggle cadence/elevation field, depending on workout type
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // To be called when the user creates a new workout
  _newWorkout(e) {
    // Validating input fields
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    // Checking that certain inputs are positive
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // 1) Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // 2) Create running object if activity is running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // 2A) Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers.');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // 3) Create cycling object if activity is cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // 2B) Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers.');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // 4) Add new object to the workout array
    this.#workouts.push(workout);

    // 5) Render workout on map as a marker
    this._renderWorkoutMarker(workout);

    // 6) Render new workout on the list
    this._renderWorkout(workout);

    // 7) Hide form and clear input fields
    this._hideForm();

    // 7) Set local storage to all workouts
    this._setLocalStorage();

    ///////////////////////////////////
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `
      ${workout.type === 'running' ? '?????????????' : '?????????????'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '?????????????' : '?????????????'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
            `;

    if (workout.type === 'running')
      html += `
          <div class="workout__details">
            <span class="workout__icon">??????</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon"> ???? </span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
      <span class="workout__icon">??????</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">???</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
    </li>
      `;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.clicks();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
    // this._renderWorkoutMarker(work);
  }

  // Reset method to clear localstorage
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
