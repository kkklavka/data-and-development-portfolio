# E-Commerce Customer Retention & Cohort Analysis

Customer analytics portfolio project built with Python and the public Olist Brazilian E-Commerce dataset.

The analysis focuses on a business question that appears frequently in e-commerce and retail work:

**How much of growth comes from customer acquisition, how many customers return, which customer groups matter most, and where are the main retention risks?**

## Business Questions

The project answers the following questions:

- How much revenue comes from first purchases vs. returning purchases?
- What percentage of customers make a repeat purchase?
- How does retention change after the first purchase?
- Which customer segments contribute the most revenue?
- Which product categories and regions drive sales?
- Does late delivery affect customer review scores?
- Is revenue growth driven by customer volume, purchase frequency, or average order value?

## Key Findings

The analysis showed that:

- revenue is heavily dependent on first purchases;
- only a small share of customers place more than one delivered order;
- customer retention falls sharply after acquisition;
- late deliveries are associated with substantially lower review scores;
- category and regional performance vary enough to justify separate retention and operational strategies.

Exact figures are calculated directly in the notebook and exported into the final Excel and PowerPoint deliverables.

## Analysis Workflow

The notebook covers:

1. Data loading and validation
2. Data quality audit
3. Transaction cleaning and preparation
4. Executive KPI calculation
5. Monthly revenue and customer trends
6. New vs. returning customer analysis
7. Cohort retention analysis
8. Repeat purchase analysis
9. RFM customer segmentation
10. Product category performance
11. Geographic performance
12. Delivery experience vs. review score
13. Revenue-driver decomposition
14. Management findings and recommendations
15. Automated Excel report generation
16. Automated PowerPoint presentation generation

## Methodology Notes

Two areas were specifically validated before publication:

- **Cohort retention:** months that are not yet observable are treated as censored rather than as zero retention.
- **RFM frequency scoring:** one-time buyers are explicitly treated as low-frequency customers instead of receiving a middle score because of tied quantiles.

All analytical values are generated programmatically. Excel formatting and the PowerPoint layout are also created from Python.

## Deliverables

Running the notebook creates:

- `outputs/ecommerce_customer_retention_analysis.xlsx`
- `outputs/ecommerce_customer_retention_analysis.pptx`
- charts used in the presentation
- management-ready summary tables

## Tech Stack

- Python
- pandas
- NumPy
- Matplotlib
- Jupyter
- XlsxWriter
- python-pptx
- KaggleHub

## Project Structure

```text
ecommerce-customer-retention-analysis/
│
├── ecommerce_customer_retention_analysis.ipynb
├── README.md
├── requirements.txt
│
├── outputs/
│   ├── ecommerce_customer_retention_analysis.xlsx
│   ├── ecommerce_customer_retention_analysis.pptx
│   └── charts/
│
└── screenshots/
```

## Run in VS Code

1. Open the project folder in VS Code.
2. Create or select a Python environment.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Open `ecommerce_customer_retention_analysis.ipynb`.
5. Select the Python kernel.
6. Click **Run All**.

The Olist dataset is downloaded automatically through `kagglehub`.

## Dataset

The project uses the public **Brazilian E-Commerce Public Dataset by Olist**.

The dataset is used only as the analytical source. This project is an independent portfolio analysis and is not affiliated with Olist.

## Portfolio Use

This case demonstrates:

- customer analytics;
- cohort retention analysis;
- e-commerce reporting;
- RFM segmentation;
- Python-based Excel automation;
- automated management reporting;
- business-oriented data storytelling.
