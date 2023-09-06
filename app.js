const express = require('express');
const crypto = require('node:crypto');
const cors = require('cors');
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://localhost:3000',
]

const app = express();
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
}))
app.disable('x-powered-by');

app.get('/', (req, res) => {
  res.json({ message: 'Hola mundo' });
});

app.get('/movies', (req, res) => {
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    return res.json(filteredMovies);
  }

  res.json(movies);
})


app.get('/movies/:id', (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) res.json(movie);
  res.status(404).json({ message: 'Movie not found' });
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body);
  if (result.error) {
    console.log('ohhh error----->', result.error.message)
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMoview = {
    id: crypto.randomUUID(),
    ...result.data
  }

  movies.push(newMoview);
  res.status(201).json(newMoview);
})

app.delete('/movies/:id', (req, res) => {
  // const origin = req.header('origin');

  // if (origin && ACCEPTED_ORIGINS.includes(origin)) {
  //   res.header('Access-Control-Allow-Origin', origin);
  // }
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }

  movies.splice(movieIndex, 1);
  res.status(204).end();
})

app.patch('movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

// app.options('/movies/:id', (req, res) => {
//   const origin = req.header('origin');

//   if (origin && ACCEPTED_ORIGINS.includes(origin)) {
//     res.header('Access-Control-Allow-Origin', origin);
//   }

//   res.header('Access-Control-Allow-Methods', 'DELETE, PATCH');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');

//   res.status(200).end();
// })
const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
