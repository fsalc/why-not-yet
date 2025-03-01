# Why-Not-Yet 

This repository holds our implementation of [**Why Not Yet: Fixing a Top-k Ranking that Is Not Fair to Individuals**](https://www.vldb.org/pvldb/vol16/p2377-chen.pdf) by Chen et al. in VLDB '23, implemented for a course project. We expose the algorithms fixing these rankings through a REST API, located in the `whynotyet` directory. It also includes a frontend (in the `web` directory), presenting users with an interface to interactively fix top-k rankings to their liking using the described algorithms.

We note the following about our implementation:
* The methods for answering the SAT, BEST, POINT, and BOX problems posed in the paper are implemented
* Solving BOX is approximate, and is done by using the monotonic core construction described in the paper
* Dominators and dominatees from consideration are removed, according to the description in the paper
* Supports the upper bound constraints included in the paper (TRIANGLE, CUBE), as well as user-defined constraints on the weights

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