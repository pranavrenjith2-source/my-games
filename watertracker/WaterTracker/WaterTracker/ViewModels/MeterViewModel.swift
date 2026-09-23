//
//  MeterViewModel.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//
import SwiftUI
import Combine

class MeterViewModel: ObservableObject {
    @Published var currentReading: Double = 0
    @Published var previousReading: Double = 0
    @Published var billAmount: Double = 0
    
    private let meterService = MeterService()
    
    func processMeterImage(_ image: UIImage) {
        meterService.uploadMeterImage(image) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let newReading):
                    self?.calculateBill(newReading: newReading)
                case .failure(let error):
                    print("Meter image processing error: \(error)")
                }
            }
        }
    }
    
    private func calculateBill(newReading: Double) {
        currentReading = newReading
        let usage = currentReading - previousReading
        
        // Example rate: $0.50 per unit
        billAmount = usage * 0.50
        
        // Update previous reading
        previousReading = currentReading
    }
}

