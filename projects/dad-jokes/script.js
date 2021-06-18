const jokeEl = document.getElementById("joke");
const jokeBtn = document.getElementById("jokeBtn");

jokeBtn.addEventListener("click", generateJoke);

generateJoke();

// using async
async function generateJoke() {
  const config = {
    headers: {
      Accept: "application/json",
    },
  };
  const req = await fetch("https://icanhazdadjoke.com/", config);
  const data = await req.json();
  jokeEl.innerHTML = data.joke;
}

// using .then
// generateJoke();

// function generateJoke() {
//   const config = {
//     headers: {
//       Accept: "application/json",
//     },
//   };
//   fetch("https://icanhazdadjoke.com/", config)
//     .then((res) => res.json())
//     .then((data) => {
//       jokeEl.innerHTML = data.joke;
//     });
// }
