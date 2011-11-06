include "authenticatorInterface.iol"
include "config.iol"

inputPort Authenticator {
Location: Authenticator_location
Protocol: sodep
Interfaces: AuthenticatorInterface
}

execution{ concurrent }

main {
  [ authenticate( request )( response ) {
    if( request.username != "homer_simpsons" || request.password != "springfield"  )  {
      throw( AuthenticationFailed )
    }
  }] { nullProcess }

  [ getTutorLocation( request )( response ) {
    if( request.username != "homer_simpsons" )  {
      response.location = Tutor_location + "/!/mrbarnes"
    }
  }] { nullProcess }

  [ getTutorDirectorLocation( request )( response ) {
    if( request.username != "homer_simpsons" )  {
      response.location = Tutor_location + "/!/mrwho"
    }
  }] { nullProcess }
}