'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { motion } from 'framer-motion';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface CodeExample {
  title: string;
  description: string;
  code: string;
  category: string;
}

export default function ExamplesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Examples' },
    { id: 'data', name: 'Data Processing' },
    { id: 'algorithms', name: 'Algorithms' },
    { id: 'web', name: 'Web Development' },
    { id: 'ml', name: 'Machine Learning' },
  ];

  const codeExamples: CodeExample[] = [
    {
      title: 'Fast Data Processing with Pandas',
      description: 'Efficient data manipulation example using pandas DataFrame operations.',
      category: 'data',
      code: `import pandas as pd
import numpy as np

def process_sales_data(file_path):
    # Load data
    df = pd.read_csv(file_path)
    
    # Clean data
    df = df.dropna(subset=['price', 'quantity'])
    
    # Transform data
    df['total'] = df['price'] * df['quantity']
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    
    # Aggregate by month and year
    monthly_sales = df.groupby(['year', 'month']).agg({
        'total': 'sum',
        'quantity': 'sum',
        'order_id': 'nunique'
    }).reset_index()
    
    monthly_sales.rename(columns={'order_id': 'num_orders'}, inplace=True)
    monthly_sales['avg_order_value'] = monthly_sales['total'] / monthly_sales['num_orders']
    
    return monthly_sales

def identify_top_products(df, n=5):
    return df.groupby('product_id').agg({
        'total': 'sum',
        'quantity': 'sum'
    }).sort_values('total', ascending=False).head(n)`
    },
    {
      title: 'Efficient Sorting Algorithm',
      description: 'Implementation of the quicksort algorithm with optimizations.',
      category: 'algorithms',
      code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
        
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)
    
def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
            
    result.extend(left[i:])
    result.extend(right[j:])
    return result`
    },
    {
      title: 'FastAPI Web Service',
      description: 'RESTful API example using FastAPI with dependency injection.',
      category: 'web',
      code: `from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Product API", description="API for managing products")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/products/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.get("/products/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(db=db, product_id=product_id, product=product)`
    },
    {
      title: 'Linear Regression from Scratch',
      description: 'Implementation of linear regression using NumPy without machine learning libraries.',
      category: 'ml',
      code: `import numpy as np
import matplotlib.pyplot as plt

class LinearRegression:
    def __init__(self, learning_rate=0.01, iterations=1000):
        self.learning_rate = learning_rate
        self.iterations = iterations
        self.weights = None
        self.bias = None
        self.cost_history = []
        
    def fit(self, X, y):
        # Initialize parameters
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        # Gradient descent
        for _ in range(self.iterations):
            y_predicted = self._predict(X)
            
            # Compute gradients
            dw = (1/n_samples) * np.dot(X.T, (y_predicted - y))
            db = (1/n_samples) * np.sum(y_predicted - y)
            
            # Update parameters
            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db
            
            # Compute cost
            cost = (1/n_samples) * np.sum((y_predicted - y)**2)
            self.cost_history.append(cost)
            
        return self
    
    def _predict(self, X):
        return np.dot(X, self.weights) + self.bias
    
    def predict(self, X):
        return self._predict(X)
    
    def score(self, X, y):
        y_pred = self.predict(X)
        u = ((y - y_pred) ** 2).sum()
        v = ((y - y.mean()) ** 2).sum()
        return 1 - u/v`
    }
  ];

  const filteredExamples = activeCategory === 'all' 
    ? codeExamples 
    : codeExamples.filter(example => example.category === activeCategory);

  const copyToClipboard = (code: string, title: string) => {
    navigator.clipboard.writeText(code);
    setCopied(title);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout title="Code Examples | M31-Mini" description="Browse Python code examples generated with M31-Mini">
      <section className="py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-blue-500 text-transparent bg-clip-text">
              Python Code Examples
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Browse these example snippets to see the quality of code you can generate with M31-Mini.
            </p>
          </motion.div>

          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-100 text-gray-300 hover:bg-dark-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {filteredExamples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl overflow-hidden border border-gray-800"
              >
                <div className="p-6 border-b border-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{example.title}</h3>
                      <p className="text-gray-400">{example.description}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-900/50 text-primary-400 border border-primary-800/50">
                      {categories.find(c => c.id === example.category)?.name}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(example.code, example.title)}
                    className="absolute top-4 right-4 p-2 bg-dark-200/70 hover:bg-dark-200 rounded-md transition-colors z-10"
                    title="Copy code"
                  >
                    {copied === example.title ? (
                      <FiCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <FiCopy className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <SyntaxHighlighter
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: 'transparent',
                      fontSize: '0.9rem',
                      padding: '1.5rem',
                    }}
                    showLineNumbers
                  >
                    {example.code}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <h3 className="text-2xl font-bold mb-4 text-white">
              Want to generate your own custom code?
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Try M31-Mini now to create professional Python code tailored to your specific needs.
            </p>
            <a
              href="/"
              className="inline-flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-primary-600/20"
            >
              Generate Your Code
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
} 