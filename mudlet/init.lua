-- init.lua - Entry point for Mudlet scripts
local directory = debug.getinfo(1).source:match("@?(.*/)")
local path = "/mudlet/"

-- Load modular scripts
loadScripts()

-- Define a reset command to reload scripts during development
function reset()
  cecho("<cyan>[Resetting scripts...]\n")
  loadScripts()
  cecho("<green>[Scripts reloaded successfully.]\n")
end

function loadScripts()
  dofile(path.."movement.lua")
  dofile(path.."combat.lua")
  dofile(path.."weaves.lua")
end

-- Register the 'reset' command for console use
tempAlias("^reset$", [[ reset() ]])
