# Why-Not-Yet 

This repository holds our implementation of the **Why Not Yet: Fixing a Top-k Ranking that Is Not Fair to Individuals** by Chen et al., in VLDB '23.

## Backend

### Setup
* Install the Python dependencies by running
```bash
cd whynotyet && pip install requirements.txt
```

### Running the API
* In order to run with mock datasets and explanations, first set the `MOCK` environment variable to `true`.
* From within the `whynotyet` directory, run
```bash
fastapi dev api.py
```

### Documentation
After starting the API, documentation can be viewed at http://localhost:8000/docs