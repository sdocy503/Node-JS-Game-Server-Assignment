//---------------------------------------------------------
// file:	UserLoginState.cpp
// author:	Matthew Picioccio
// email:	matthew.picioccio@digipen.edu
//
// brief:	The menu shown when the user is connecting to the user service, retrieving the necessary configuration
//
// Copyright © 2021 DigiPen, All rights reserved.
//---------------------------------------------------------
#include "UserLoginState.h"
#include "ConnectingMenuState.h"
#include "GameStateManager.h"
#include <cpprest/http_client.h>
#include <cpprest/json.h>


UserLoginState::UserLoginState(NetworkedScenarioState::NetworkedScenarioStateCreator scenario_state_creator, std::string game_type, ClientConfiguration configuration)
	: scenario_state_creator_(scenario_state_creator),
  	  game_type_(game_type),
	  configuration_(configuration),
	  web_client_(utility::conversions::to_string_t(configuration.user_service))
{
	operation_description_ = "Logging in and connecting to the user service...";
	InitiateUserRequest();
}


UserLoginState::~UserLoginState() = default;


void UserLoginState::Update()
{
	// if the user presses ESC from the main menu, the process will exit.
	if (CP_Input_KeyTriggered(KEY_ESCAPE))
	{
		GameStateManager::ReturnToBaseState();
		return;
	}

	// check to see if the web request is done
	// -- if it is, .get() will not block
	// -- this way, we can draw the screen while we wait...
	if (active_task_.is_done())
	{
		try
		{
			// Extract data from the connect request once it's finished and save it
			auto connect_response_data = active_task_.get();
			configuration_.avatar = utility::conversions::to_utf8string(connect_response_data[U("avatar")].as_string());
			configuration_.token = utility::conversions::to_utf8string(connect_response_data[U("token")].as_string());
			configuration_.game_port = connect_response_data[U("game_port")].as_integer();

			std::cout << "Connect token session: " << configuration_.token.c_str() << std::endl;
			auto* connecting_state = new ConnectingMenuState(scenario_state_creator_, game_type_, configuration_);
			GameStateManager::ApplyState(connecting_state);
		}
		catch (const std::exception& e)
		{
			std::cout << "Exception from web request: " << e.what() << std::endl << std::flush;
			GameStateManager::ReturnToBaseState();
		}
	}
}


void UserLoginState::Draw()
{
	// draw the description
	CP_Settings_TextSize(30);
	CP_Settings_TextAlignment(CP_TEXT_ALIGN_H_LEFT, CP_TEXT_ALIGN_V_TOP);
	CP_Settings_Fill(CP_Color_Create(255, 255, 255, 255));
	CP_Font_DrawText(operation_description_.c_str(), 0.0f, 0.0f);
}


void UserLoginState::InitiateUserRequest()
{
	// Build the login data json object
	auto login_data = web::json::value::parse("{}");
	login_data[U("username")] = web::json::value(utility::conversions::to_string_t(configuration_.username));
	login_data[U("password")] = web::json::value(utility::conversions::to_string_t(configuration_.password));

	// Send the first request for login
	active_task_ = web_client_.request(web::http::methods::POST, U("/api/v1/login"), login_data)
		.then([](web::http::http_response login_response)
		{
				// Check status code and if it's ok then we extract body
				if (login_response.status_code() != web::http::status_codes::OK)
					throw std::exception("Login to user service failed");
				return login_response.extract_json();
		}).then([=](web::json::value session_data) mutable
		{
				// Append the game_type to the data we recieved and send it back as a connect request
				session_data[U("game_type")] = web::json::value(utility::conversions::to_string_t(game_type_));
				return web_client_.request(web::http::methods::POST, U("/api/v1/connect"), session_data);
		}).then([](web::http::http_response get_connect_response)
		{
				// If we got back ok then return the body data we got from the connect which is used above
				if (get_connect_response.status_code() != web::http::status_codes::OK)
					throw std::exception("Connect to user service failed");
				return get_connect_response.extract_json();
		});
}