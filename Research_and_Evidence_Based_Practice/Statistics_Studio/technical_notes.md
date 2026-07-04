# Technical Notes

## Calculation methods

RTApps Statistics Studio uses browser-side JavaScript for all calculations.

Implemented functions include:

- Sample mean, median, variance, standard deviation, quartiles, IQR, skewness, and excess kurtosis
- Frequency tables with valid percentages
- Welch independent-samples t test by default
- Optional equal-variance independent-samples t test
- Paired-samples t test
- Pearson product-moment correlation
- Simple linear regression
- Chi-square test of independence using the upper-tail incomplete gamma function
- Confusion matrix metrics
- Basic Likert item summaries

## P-values

- t test and Pearson correlation p-values use the Student t distribution via the regularized incomplete beta function.
- Chi-square p-values use the regularized upper incomplete gamma function.

These are appropriate for education and small-to-moderate classroom datasets, but critical analyses should be verified in professional software.

## Missing data

Blank cells, `NA`, and `N/A` are treated as missing.

## CSV parsing

The app supports standard comma-separated files with a header row and quoted fields.

## Browser compatibility

The app is written with plain HTML, CSS, and JavaScript and avoids build tooling. It should work in current versions of Chrome, Edge, Firefox, and Safari.
