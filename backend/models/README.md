# Drop your trained model files here

The backend looks for these exact filenames. Drop your file in, restart
the backend, done. If a file is missing, that service falls back to a
mock so the dashboard still runs.

| Component         | Filename (rename your file to one of these)              |
| ----------------- | -------------------------------------------------------- |
| Vision Taster     | `vision_taster.pt`   **or**  `vision_taster.keras`       |
| Plucking          | `plucking.pt`        **or**  `plucking.keras`            |
| Withering         | `withering_torch.pt` **and** `withering_keras.keras`     |
| Foreign Particle  | `foreign_particle.pt`  (YOLOv8 weights)                  |
| Auction Price     | `auction_price.pkl`  **or**  `auction_price.joblib`      |

After uploading, open the matching `backend/services/<name>.py` and
finish the `_predict_with_model()` function — the preprocessing
(image resize, normalization, feature order) has to match how you
trained the model. Each service file has a commented example.
