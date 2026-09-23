import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Welcome to WaterTracker")
                    .font(.title)
                    .padding()

                NavigationLink(destination: CaptureMeterView()) {
                    Text("Capture Meter Reading")
                        .font(.headline)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
            }
            .navigationBarTitle("Home", displayMode: .inline)
        }
    }
}
