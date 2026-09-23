//
//  BillingViewModel.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//

import SwiftUI
import Combine

class BillingViewModel: ObservableObject {
    @Published var usage: Double = 0.0
    @Published var amount: Double = 0.0
    
    private let billEndpoint = "https://your-backend.com/bill"
    
    /// Calculates the bill by sending oldReading and newReading to the backend.
    /// The backend returns usage and amount in JSON.
    func calculateBill(oldReading: Double, newReading: Double) {
        
        let requestBody: [String: Any] = [
            "oldReading": oldReading,
            "newReading": newReading
        ]
        
        // Attempt to encode the request body to JSON
        guard let jsonData = try? JSONSerialization.data(withJSONObject: requestBody, options: []) else {
            print("Failed to encode JSON for bill request.")
            return
        }
        
        // Construct the request
        guard let url = URL(string: billEndpoint) else {
            print("Invalid bill endpoint URL.")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        // Perform the network request
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            
            // Check for network errors
            if let error = error {
                print("Network error during bill calculation: \(error.localizedDescription)")
                return
            }
            
            // Validate response data
            guard let data = data else {
                print("No data returned from /bill endpoint.")
                return
            }
            
            do {
                // Temporary struct to decode the JSON response
                struct BillResponse: Decodable {
                    let usage: Double
                    let amount: Double
                }
                
                // Decode the response
                let decoded = try JSONDecoder().decode(BillResponse.self, from: data)
                
                // Update usage and amount on the main thread
                DispatchQueue.main.async {
                    self?.usage = decoded.usage
                    self?.amount = decoded.amount
                }
                
            } catch {
                print("Failed to decode bill response: \(error)")
            }
        }.resume()
    }
}
