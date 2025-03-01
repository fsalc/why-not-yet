# Why-Not-Yet 

This repository holds our implementation of the **Why Not Yet: Fixing a Top-k Ranking that Is Not Fair to Individuals** by Chen et al., in VLDB '23.

Our implementation of their algorithm contains the following:
* Methods for answering the SAT, BEST, POINT, and BOX problems posed in the paper
* Solving BOX uses the monotonic core construction described in the paper
* Removes dominators and dominatees from consideration
* Supports the included upper bound constraints (TRIANGLE, CUBE), as well as user-defined constraints on the weights

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