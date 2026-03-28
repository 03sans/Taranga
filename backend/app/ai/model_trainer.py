import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib
import os

def train_model():
    # Load synthetic dataset
    data_path = 'data/synthetic_dataset.csv'
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return
        
    df = pd.read_csv(data_path)
    
    # Separate features and target labels
    feature_cols = [col for col in df.columns if col.startswith('q')]
    label_cols = ['dyslexia', 'dyscalculia', 'dysgraphia', 'nvld', 'apd']
    
    X = df[feature_cols]
    y = df[label_cols]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train the multi-label model
    print("Training Multi-Label RandomForestClassifier...")
    base_clf = RandomForestClassifier(n_estimators=100, random_state=42)
    model = MultiOutputClassifier(base_clf, n_jobs=-1)
    
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    print("Evaluation Report:")
    print(classification_report(y_test, predictions, target_names=label_cols))
    
    # Export model
    os.makedirs('app/ai/models', exist_ok=True)
    model_path = 'app/ai/models/ml_model.joblib'
    joblib.dump(model, model_path)
    
    print(f"Model successfully saved to {model_path}")

if __name__ == "__main__":
    train_model()
