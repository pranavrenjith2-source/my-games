//
//  Untitled.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//

import Foundation

struct User: Codable {
    let id: String
    var email: String
    var password: String?  // Ideally stored only for registration or login
    // Additional fields as necessary
}
