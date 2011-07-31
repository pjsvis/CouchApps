Feature: TagCloud
    When going to the main page
    I should see topN tag cloud

    Scenario: Sanity 
        When I go home
		     Then there should be "30" entries of "tags"
        When I select "java" tag
         Then all visible snippets should be of type "java"
        When I click on snippet "10010" view code link
         Then the snippet code should be displayed
