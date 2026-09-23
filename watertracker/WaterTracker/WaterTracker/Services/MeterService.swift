//
//  MeterService.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//

import Foundation
import UIKit

class MeterService {
    
    func uploadMeterImage(_ image: UIImage, completion: @escaping (Result<Double, Error>) -> Void) {
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            completion(.failure(MeterServiceError.invalidImage))
            return
        }
        
        let endpoint = "https://your-backend.com/meterReading"
        guard let url = URL(string: endpoint) else {
            completion(.failure(MeterServiceError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Convert image to base64
        let base64String = imageData.base64EncodedString()
        let jsonDict = ["image": base64String]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: jsonDict, options: [])
        } catch {
            completion(.failure(error))
            return
        }
        
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(MeterServiceError.noData))
                return
            }
            
            do {
                struct MeterReadingResponse: Decodable {
                    let reading: Double
                }
                let decoded = try JSONDecoder().decode(MeterReadingResponse.self, from: data)
                completion(.success(decoded.reading))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

enum MeterServiceError: Error {
    case invalidImage
    case invalidURL
    case noData
}
