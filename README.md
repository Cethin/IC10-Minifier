# IC10 Minifier README

## Features

Minifies IC10 code for the game Stationeers to save space. Replaces defines, aliases, and labels, pre-calculates hashes, removes blank lines, whitespace, and comments. This allows you to write more readable code without worrying about sacrificing space.

Also converts Celsius to Kelvin automatically. Any number with a 'c' or 'C' following it is converted to it's value in Kelvin. (If you want the celsius value, don't include the 'c'.)

## How to use

Install the IC10-Minifier plugin for VSCode and run "Minify IC10" on your file.

This will create a new file in the same directory with the prefixed "minified_" with the minified IC10 program.
