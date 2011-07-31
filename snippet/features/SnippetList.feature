Feature: SnippetList
    Code snippets should be listed in the main page

    Scenario: Main Page 
        When I go home
         Then most common tag snippets should be listed
