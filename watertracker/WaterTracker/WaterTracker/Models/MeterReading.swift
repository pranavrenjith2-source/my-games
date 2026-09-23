//
//  MeterReading.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//
import Foundation

struct MeterReading: Codable {
    let id: String
    let userId: String
    let addressId: String
    let readingValue: Double
    let timestamp: Date
}

