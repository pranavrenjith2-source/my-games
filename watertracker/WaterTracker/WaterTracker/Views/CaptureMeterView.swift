//
//  Untitled.swift
//  WaterTracker
//
//  Created by Pranav Renjith on 1/1/25.
//

import SwiftUI

struct CaptureMeterView: View {
    @ObservedObject var viewModel: MeterViewModel
    @State private var showImagePicker = false
    @State private var selectedImage: UIImage?
    
    var body: some View {
        VStack {
            if let selectedImage = selectedImage {
                Image(uiImage: selectedImage)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 300)
            } else {
                Text("No image selected")
                    .foregroundColor(.gray)
            }
            
            Button("Capture/Select Meter Photo") {
                showImagePicker = true
            }
            .padding()
            
            Text("Current Reading: \(viewModel.currentReading, specifier: "%.2f")")
                .padding(.top, 20)
            
            Text("Bill Amount: $\(viewModel.billAmount, specifier: "%.2f")")
                .padding(.bottom, 20)
        }
        .sheet(isPresented: $showImagePicker) {
            ImagePickerView(image: $selectedImage, onImagePicked: { image in
                viewModel.processMeterImage(image)
            })
        }
        .navigationBarTitle("WaterTracker", displayMode: .inline)
    }
}

struct ImagePickerView: UIViewControllerRepresentable {
    @Environment(\.presentationMode) private var presentationMode
    @Binding var image: UIImage?
    
    var onImagePicked: (UIImage) -> Void
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera  // or .photoLibrary
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) { }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(self, onImagePicked: onImagePicked)
    }
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: ImagePickerView
        let onImagePicked: (UIImage) -> Void
        
        init(_ parent: ImagePickerView, onImagePicked: @escaping (UIImage) -> Void) {
            self.parent = parent
            self.onImagePicked = onImagePicked
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let uiImage = info[.originalImage] as? UIImage {
                onImagePicked(uiImage)
                parent.image = uiImage
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

