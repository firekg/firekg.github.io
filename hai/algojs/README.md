The algorithm part of human-algorithm interaction (in Javascript)

Classification algorithms:
1. Gaussian naive Bayes
2. Logistic regression
Required methods:
* posterior
* posterior predictive
* accuracy
* classification boundary

Sampling algorithms:
1. filtering: highest posterior
2. active: most uncertain
3. random

Analysis utilities:
1. trial-by-trial predictive accuracy. This is how well the algorithm predicts the user's choice.
2. trial-by-trial recommendation accuracy. This is how much the user liked the algorithm's recommendation.
3. post-test accuracy. This is how well the algorithm's choices match the user's choices in check phase.

Test suits:
* random seeding in Olfa's code which uses scikit-learn)
* gather data for Olfa's code (which uses scikit-learn)
* unit testing

Visualization utilities:
1. data points and classification boundaries

Simulation suit <-> experiment:
* generate training data <-> training phase OR the first XX trials in interaction phase?
* interaction <-> interaction phase
* post test <-> check phase

An example setup:
1. Generate locations and labels via two Gaussians
2. run classificatino algorithm
3. plot data points and classification boundary
4. show unit test results
