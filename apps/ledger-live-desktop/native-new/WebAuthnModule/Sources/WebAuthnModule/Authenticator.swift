import Foundation
import AuthenticationServices

@available(macOS 15.1, *)
public class Authenticator: NSObject {
    private var webAuthnSession: ASAuthorizationController?

    public func authenticateWithPasskey(completion: @escaping (Bool, Error?) -> Void) {
        let relyingPartyID = "your.relyingparty.id" // Replace with your actual relying party ID
        let passkeyProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: relyingPartyID)
        
        // Create a unique challenge (typically generated server-side)
        let challengeData = "your_challenge_data".data(using: .utf8)! // Replace with an actual challenge

        // Create a passkey assertion request
        let request = passkeyProvider.createCredentialAssertionRequest(challenge: challengeData)

        // Set up the authorization controller with the request
        webAuthnSession = ASAuthorizationController(authorizationRequests: [request])
        webAuthnSession?.delegate = self
        webAuthnSession?.presentationContextProvider = self

        // Begin the request, which will trigger the passkey prompt
        webAuthnSession?.performRequests()
    }
}

@available(macOS 15.1, *)
extension Authenticator: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
            // Handle successful passkey authorization here
            print("Passkey authentication succeeded")
            completion(true, nil)
        } else {
            completion(false, nil)
        }
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        // Handle errors from the passkey prompt
        print("Passkey authentication failed with error: \(error.localizedDescription)")
        completion(false, error)
    }
}

@available(macOS 15.1, *)
extension Authenticator: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Specify the window to anchor the passkey prompt
        return NSApplication.shared.windows.first! // Adjust this if you need a specific window
    }
}