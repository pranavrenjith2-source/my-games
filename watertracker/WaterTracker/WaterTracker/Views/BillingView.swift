//
//  Untitled.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//

import SwiftUI

struct BillingView: View {
    @StateObject private var billingVM = BillingViewModel()
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Water Usage: \(billingVM.usage, specifier: "%.2f") units")
            Text("Bill Amount: $\(billingVM.amount, specifier: "%.2f")")
            
            Button("Calculate Bill") {
                // Example: old reading = 100, new reading = 120
                billingVM.calculateBill(oldReading: 100, newReading: 120)
            }
        }
        .padding()
        .navigationTitle("Billing")
    }
}
