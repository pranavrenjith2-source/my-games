//
//  NetworkService.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//
import Foundation

class NetworkService {
    static let shared = NetworkService()
    private init() {}
    
    func sendRequest<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil,
        completion: @escaping (Result<T, Error>) -> Void
    ) {
        guard let url = URL(string: endpoint) else {
            completion(.failure(NetworkError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        
        // Add headers if needed (e.g., authorization tokens)
        // request.addValue("Bearer <token>", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NetworkError.noData))
                return
            }
            do {
                let decoded = try JSONDecoder().decode(T.self, from: data)
                completion(.success(decoded))
            } catch let decodeError {
                completion(.failure(decodeError))
            }
        }.resume()
    }
}

enum NetworkError: Error {
    case invalidURL
    case noData
}
