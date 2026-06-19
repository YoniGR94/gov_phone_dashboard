# Government Mobile Leasing Dashboard

## Overview

This project is an interactive dashboard for Israeli government employees participating in the government mobile-phone leasing program.

The application allows users to select their employment rank and a mobile device, then calculates:

- Monthly employee cost
- Monthly ministry participation
- Device buyout cost at the end of the lease period
- Total 24-month ownership cost
- Early termination cost for each month of the lease
- Device comparisons across available models

The goal is to provide transparency and help employees understand the real financial implications of each device option.

---

## Features

### Step 1 – Employee & Device Selection

Users choose:

- Device model
- Employment group (e.g. Academic, Administrative, Military, etc.)
- Rank / grade

The system automatically maps the selected rank to the appropriate participation tier.

### Step 2 – Dashboard

Displays:

- Monthly employee payment
- Monthly government participation
- End-of-lease buyout price
- Accumulated cost over time
- Early termination simulation
- Device comparison charts

---

## Data Sources

### Devices

Device information is loaded from a public Google Sheets document:

- Manufacturer
- Model
- Storage size
- Monthly leasing cost
- End-of-lease purchase price
- Weighted list price
- Price category

### Business Rules

Additional configuration is stored locally as JSON files:

- Grade bands
- Participation tiers
- Government contribution rules
- Early termination rules
- Ministry/rank mappings

---

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- PapaParse
- React Hook Form
- Zod
- Lucide Icons

Deployment:

- GitHub
- Vercel

---


Hope you will find this dashboard usefull!
