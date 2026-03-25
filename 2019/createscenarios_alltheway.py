import numpy as np
import pandas as pd
import csv
import itertools


sourcePicks = "picks2019worldsbest.csv"

picks = pd.read_csv(sourcePicks, index_col=0) #make sure to delete user name column
master = pd.read_csv("masterbracket4teams.csv", index_col=0)  #make the master bracket mannually to start, leaving unpicked games as -1

#winner = picks.index

seeds = master.iloc[2]
points = master.iloc[1]

#print(master)

pointa = np.array(points,dtype=long)
seeda = np.array(seeds,dtype=long)

bracket = 0

fileName1 = 'scenario_pts_final4_WB.csv'

with open(fileName1, 'wb') as csvfile:
  wr = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)
  output = master.columns.tolist()[48:]
  output = output + picks.index.tolist()
  wr.writerow(output)

  for scenario in itertools.product(range(2), repeat=3):  #change repeat and scenario array index to go from 0 to {games remaining}
    thiscase = master.iloc[0]
    #thiscase[48] = thiscase[48 - scenario[0] - 15]  # for Elite Eight games
    #thiscase[49] = thiscase[48 - scenario[1] - 13]
    #thiscase[50] = thiscase[48 - scenario[2] - 11]
    #thiscase[51] = thiscase[48 - scenario[3] - 9]
    #thiscase[52] = thiscase[48 - scenario[4] - 7]
    #thiscase[53] = thiscase[48 - scenario[5] - 5]
    #thiscase[54] = thiscase[48 - scenario[6] - 3]
    #thiscase[55] = thiscase[48 - scenario[7] - 1]

#    thiscase[56] = thiscase[56 - scenario[0] - 7] #for Final Four Games
    #thiscase[57] = thiscase[56 - scenario[1] - 5]
    #thiscase[58] = thiscase[56 - scenario[2] - 3]
#    thiscase[59] = thiscase[56 - scenario[3] - 1]

    thiscase[60] = thiscase[60 - scenario[0] - 3] # for National Semi Finals
    thiscase[61] = thiscase[60 - scenario[1] - 1]

    thiscase[62] = thiscase[62 - scenario[2] - 1] # for Championship
   

    for i in range(15):
      seeda[48 + i] = int(thiscase[48+i][:2])   #can't assign -1 to the seeda for some reason
    
    #print seeda
    #print picks.index    

    datarow = thiscase.tolist()[48:]
    #print datarow

    for entry in picks.index:
      #print picks.loc[entry][1:]
      #print thiscase
      bracketpoints = sum((picks.loc[entry] == thiscase) * pointa) + sum((picks.loc[entry] == thiscase) * seeda)   #sumproduct of matching games for each entry
      datarow.append(bracketpoints)

    wr.writerow(datarow)


### OUTPUT should be: index = scenario number, columns = gamenumber + entry, values = game outcome + entry_points

csvfile.close()

### Start part 2, previously rank.py

scenarios = pd.read_csv(fileName1)

#select subset of columns into a dataframe
#rank each cell in the row
#write that rank into a new dataframe
#write that dataframe to csv

startbracket = 63
bracketsEntered = 105
endingIndex = 15 + bracketsEntered

df = scenarios.iloc[:,15:endingIndex]

#print df

dfrank = df.T.rank(ascending=False)

ranks = dfrank.T

#print ranks

ranklist = {}

columns = ranks.columns.tolist()  #columns as bracket names


for column in columns:
  ranklist[column] = ranks[column].value_counts()

print ranklist

outputframe = pd.DataFrame(ranklist)

#print outputframe

outputframe.to_csv('output_ranks_4_WB.csv')

# now create a dataframe for the critical games analysis

gamesremaining = scenarios.iloc[:,:15]

critgames = pd.merge(gamesremaining, ranks, left_index=True, right_index=True)

critgames.to_csv('critgames4_WB.csv')

#resort the columns in the order of rank


print dfrank


### Start Part 3, critical games analysis

scenarios = critgames
picks = pd.read_csv(sourcePicks)

print picks.index
print picks.info()

winner = picks['Bracket Name'].tolist()

podium = [1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,42]

columns = scenarios.columns[1:16].tolist() #15 games remaining
outputcols = ['Entry', 'Finishing Position'] + columns

with open('critical_path_WB4.csv', 'wb') as csvfile:
	output = outputcols
	wr = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)
	wr.writerow(output)
	#outputframe = pd.DataFrame()

	for place in podium:		
		for w in winner:
			row = []
			subset = []
			subset = scenarios[scenarios[w] == place]
			#print w
			#print len(subset['EE1'])
			row.append(w)
			row.append(place)
			#print subset.iloc[:,1:16]
			for i, c in enumerate(subset.iloc[:,1:16].columns):
				try:
					#print c
					#print subset[c].value_counts()[0]
					#print subset.index
					if subset[c].value_counts()[0] == len(subset.index):
						row.append(subset[c].value_counts().index[0])
						#print "--%s---" % c
						#print subset[c].value_counts().index[0]						
					else:
						row.append(' ')
				except IndexError:
					pass
				finally:
					pass

			#print row
			wr.writerow(row)

csvfile.close()



