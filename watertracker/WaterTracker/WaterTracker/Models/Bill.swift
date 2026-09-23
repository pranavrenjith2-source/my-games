//
//  Billybob.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//

import Foundation

struct Bill: Codable {
    let userId: String
    let usage: Double
    let amount: Double
    let issuedDate: Date
}
