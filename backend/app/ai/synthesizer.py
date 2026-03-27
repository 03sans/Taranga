import pandas as pd
import numpy as np
import os

# Set random seed for reproducibility
np.random.seed(42)

def generate_synthetic_data(num_samples=1000):
    # Features (15 questions scaled 1-5, higher means more severe indicator)
    # Q1-Q3: Reading/Spelling (Dyslexia)
    # Q4-Q6: Math/Logic (Dyscalculia)
    # Q7-Q9: Handwriting/Motor (Dysgraphia)
    # Q10-Q12: Spatial/Social (NVLD)
    # Q13-Q15: Listening/Processing (APD)
    
    data = []
    
    for _ in range(num_samples):
        # Base probabilities
        is_dyslexia = np.random.rand() > 0.8  # 20% prevalence in synthetic dataset
        is_dyscalculia = np.random.rand() > 0.85
        is_dysgraphia = np.random.rand() > 0.85
        is_nvld = np.random.rand() > 0.9
        is_apd = np.random.rand() > 0.85
        
        # Generate features with noise. If the label is True, score is higher (3-5). Else lower (1-3).
        row = {
            'q1_reading_slow': np.random.randint(3, 6) if is_dyslexia else np.random.randint(1, 4),
            'q2_spelling_errors': np.random.randint(3, 6) if is_dyslexia else np.random.randint(1, 4),
            'q3_letter_reversal': np.random.randint(3, 6) if is_dyslexia else np.random.randint(1, 3),
            
            'q4_math_struggle': np.random.randint(3, 6) if is_dyscalculia else np.random.randint(1, 4),
            'q5_number_memory': np.random.randint(3, 6) if is_dyscalculia else np.random.randint(1, 4),
            'q6_time_concept': np.random.randint(3, 6) if is_dyscalculia else np.random.randint(1, 3),
            
            'q7_messy_writing': np.random.randint(3, 6) if is_dysgraphia else np.random.randint(1, 4),
            'q8_pencil_grip': np.random.randint(3, 6) if is_dysgraphia else np.random.randint(1, 4),
            'q9_spacing_words': np.random.randint(3, 6) if is_dysgraphia else np.random.randint(1, 3),
            
            'q10_social_cues': np.random.randint(3, 6) if is_nvld else np.random.randint(1, 4),
            'q11_spatial_tasks': np.random.randint(3, 6) if is_nvld else np.random.randint(1, 4),
            'q12_routine_change': np.random.randint(3, 6) if is_nvld else np.random.randint(1, 3),
            
            'q13_background_noise': np.random.randint(3, 6) if is_apd else np.random.randint(1, 4),
            'q14_verbal_instructions': np.random.randint(3, 6) if is_apd else np.random.randint(1, 4),
            'q15_similar_sounds': np.random.randint(3, 6) if is_apd else np.random.randint(1, 3),
            
            # Targets
            'dyslexia': int(is_dyslexia),
            'dyscalculia': int(is_dyscalculia),
            'dysgraphia': int(is_dysgraphia),
            'nvld': int(is_nvld),
            'apd': int(is_apd)
        }
        
        # Add random comorbidity modifier (overlap between conditions)
        if is_dyslexia and np.random.rand() > 0.5:
            row['dysgraphia'] = 1
            row['q7_messy_writing'] = np.random.randint(3, 6)
            row['q8_pencil_grip'] = np.random.randint(3, 6)
            
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Save dataset
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/synthetic_dataset.csv', index=False)
    print(f"Generated {num_samples} records and saved to data/synthetic_dataset.csv")

if __name__ == "__main__":
    generate_synthetic_data(1000)
