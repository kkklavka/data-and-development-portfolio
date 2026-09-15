# E-Commerce Customer Retention & Revenue Analysis

Portfolio case based on the Olist Brazilian E-Commerce public dataset.

## Scope

The project covers:

- data quality audit and cleaning;
- monthly revenue and customer trends;
- new vs. returning customer analysis;
- cohort retention;
- repeat purchase behavior;
- RFM customer segmentation;
- product category and geographic performance;
- delivery experience vs. review score;
- revenue-driver decomposition;
- management recommendations.

## Reproducibility note

All analytical tables, metrics, charts, the Excel workbook and the PowerPoint
presentation are generated from the Jupyter notebook.

During validation of the first draft, two methodology issues were corrected:

1. Unobservable future cohort months are treated as censored rather than zero retention.
2. RFM frequency scoring uses actual repeat-order counts so one-time buyers are not
   classified as mid-frequency customers because of tied quantiles.

Workbook formatting and presentation layout are applied programmatically.
Analytical values are not manually overwritten after export.

## Run

Install dependencies:

```bash
pip install -r requirements.txt
```

Then open `ecommerce_customer_retention_analysis_final.ipynb` and run all cells.

The notebook downloads the public Olist dataset automatically through `kagglehub`
and creates the final Excel and PowerPoint deliverables in `outputs/`.
